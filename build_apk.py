import os
import shutil
import zipfile
import urllib.request
import subprocess
from PIL import Image

# Local directories
app_dir = os.path.dirname(os.path.abspath(__file__))
compilers_dir = os.path.join(app_dir, "compilers")
jdk_zip = os.path.join(compilers_dir, "jdk.zip")
jdk_extract_dir = os.path.join(compilers_dir, "jdk")

# Android SDK configurations
sdk_dir = os.environ.get("ANDROID_HOME", r"D:\Android\Sdk")
if not os.path.exists(sdk_dir):
    for candidate in [r"D:\Android\Sdk", r"C:\Users\dp327\AppData\Local\Android\Sdk", r"C:\Users\Prince\AppData\Local\Android\Sdk"]:
        if os.path.exists(candidate):
            sdk_dir = candidate
            break

build_tools_dir = os.path.join(sdk_dir, "build-tools", "34.0.0")
android_jar = os.path.join(sdk_dir, "platforms", "android-34", "android.jar")

aapt_exe = os.path.join(build_tools_dir, "aapt.exe")
d8_bat = os.path.join(build_tools_dir, "d8.bat")
apksigner_bat = os.path.join(build_tools_dir, "apksigner.bat")
zipalign_exe = os.path.join(build_tools_dir, "zipalign.exe")

build_temp_dir = os.path.join(app_dir, "build_temp")
output_apk = os.path.join(app_dir, "DecisionHelper.apk")

print("--- Standalone Native Android Build Setup ---")

# Step 1: Create compilers directory
if not os.path.exists(compilers_dir):
    os.makedirs(compilers_dir)

# Step 2: Download portable JDK 17 if not already downloaded
jdk_bin_dir = None
# Find if jdk folder already exists
if os.path.exists(jdk_extract_dir):
    for root, dirs, files in os.walk(jdk_extract_dir):
        if "javac.exe" in files:
            jdk_bin_dir = root
            break

if jdk_bin_dir:
    print("Found existing portable Java JDK at:", jdk_bin_dir)
else:
    print("Downloading portable JDK 17 (~150 MB)...")
    jdk_url = "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.12%2B7/OpenJDK17U-jdk_x64_windows_hotspot_17.0.12_7.zip"
    
    def reporthook(blocknum, blocksize, totalsize):
        readsofar = blocknum * blocksize
        if totalsize > 0:
            percent = readsofar * 1e2 / totalsize
            s = f"\rDownloading: {percent:5.1f}% [{readsofar} / {totalsize} bytes]"
            print(s, end="")
        else:
            print(f"\rRead {readsofar} bytes", end="")
            
    try:
        urllib.request.urlretrieve(jdk_url, jdk_zip, reporthook)
        print("\nDownload complete.")
    except Exception as e:
        print("\nError downloading JDK:", e)
        exit(1)
        
    print("Extracting JDK...")
    with zipfile.ZipFile(jdk_zip, 'r') as zip_ref:
        zip_ref.extractall(jdk_extract_dir)
    print("Extraction complete.")
    
    # Locate bin directory
    for root, dirs, files in os.walk(jdk_extract_dir):
        if "javac.exe" in files:
            jdk_bin_dir = root
            break

if not jdk_bin_dir:
    print("Error: Could not locate javac.exe inside extracted JDK.")
    exit(1)

# Configure environment variables for child processes (d8.bat needs JAVA_HOME and java in Path)
java_home = os.path.dirname(jdk_bin_dir) # parent of bin directory
os.environ["JAVA_HOME"] = java_home
os.environ["Path"] = jdk_bin_dir + os.path.pathsep + os.environ.get("Path", "")

# Resolving Java executable paths
javac_exe = os.path.join(jdk_bin_dir, "javac.exe")
jar_exe = os.path.join(jdk_bin_dir, "jar.exe")
keytool_exe = os.path.join(jdk_bin_dir, "keytool.exe")

print("Using compiler binaries:")
print(" - Javac:", javac_exe)
print(" - Jar:", jar_exe)
print(" - Keytool:", keytool_exe)

# Load and increment version code at startup
version_file = os.path.join(app_dir, "version.txt")
version_code = 1
if os.path.exists(version_file):
    try:
        with open(version_file, "r", encoding="utf-8") as vf:
            version_code = int(vf.read().strip()) + 1
    except:
        version_code = 1
with open(version_file, "w", encoding="utf-8") as vf:
    vf.write(str(version_code))

print(f"Auto-incrementing version code to: {version_code}")

# Step 3: Create compiler temp project folders
if os.path.exists(build_temp_dir):
    shutil.rmtree(build_temp_dir)
os.makedirs(os.path.join(build_temp_dir, "src", "com", "decision", "helper", "pro"))
os.makedirs(os.path.join(build_temp_dir, "res", "drawable"))
os.makedirs(os.path.join(build_temp_dir, "assets", "www"))
os.makedirs(os.path.join(build_temp_dir, "obj"))
os.makedirs(os.path.join(build_temp_dir, "bin"))

# Step 4: Write MainActivity.java
java_content = """package com.decision.helper.pro;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.JavascriptInterface;
import android.view.Window;
import android.content.Intent;
import android.net.Uri;
import android.os.Environment;
import android.os.AsyncTask;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends Activity {
    private WebView webView;
    private int CURRENT_VERSION = 1;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        
        // Disable StrictMode Uri exposure checks to allow file:// URIs without FileProvider complexities
        try {
            java.lang.reflect.Method m = android.os.StrictMode.class.getMethod("disableDeathOnFileUriExposure");
            m.invoke(null);
        } catch (Exception e) {
            e.printStackTrace();
        }
        webView = new WebView(this);
        webView.clearCache(true);
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        // Disable pinch zoom & scrollbars for application feel
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);
        
        // Safe file URL accesses
        try {
            java.lang.reflect.Method setAllowFileAccessFromFileURLs = WebSettings.class.getMethod(
                "setAllowFileAccessFromFileURLs", boolean.class);
            setAllowFileAccessFromFileURLs.invoke(webSettings, true);
            
            java.lang.reflect.Method setAllowUniversalAccessFromFileURLs = WebSettings.class.getMethod(
                "setAllowUniversalAccessFromFileURLs", boolean.class);
            setAllowUniversalAccessFromFileURLs.invoke(webSettings, true);
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        // Inject JS updater interface
        webView.addJavascriptInterface(new UpdaterInterface(), "AndroidUpdater");
        
        webView.setWebViewClient(new WebViewClient());
        String url = "file:///android_asset/www/index.html";
        if (savedInstanceState == null) {
            url += "?fresh=true";
        }
        webView.loadUrl(url);
        setContentView(webView);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else if (webView != null) {
            webView.loadUrl("javascript:window.handleAndroidBackKey();");
        } else {
            super.onBackPressed();
        }
    }

    class UpdaterInterface {
        @JavascriptInterface
        public int getVersionCode() {
            return CURRENT_VERSION;
        }

        @JavascriptInterface
        public void triggerUpdate(final String downloadUrl) {
            AsyncTask.execute(new Runnable() {
                @Override
                public void run() {
                    try {
                        URL url = new URL(downloadUrl);
                        HttpURLConnection c = (HttpURLConnection) url.openConnection();
                        c.setRequestMethod("GET");
                        c.connect();

                        File filesDir = getExternalFilesDir(null);
                        if (filesDir == null) {
                            filesDir = getFilesDir();
                        }
                        if (!filesDir.exists()) {
                            filesDir.mkdirs();
                        }
                        File apkFile = new File(filesDir, "DecisionHelper_Update.apk");
                        if (apkFile.exists()) {
                            apkFile.delete();
                        }

                        FileOutputStream fos = new FileOutputStream(apkFile);
                        InputStream is = c.getInputStream();

                        byte[] buffer = new byte[1024];
                        int len1 = 0;
                        while ((len1 = is.read(buffer)) != -1) {
                            fos.write(buffer, 0, len1);
                        }
                        fos.close();
                        is.close();

                        // Launch package installer using custom content provider to support Android 10+
                        Uri apkUri = Uri.parse("content://com.decision.helper.pro.fileprovider/DecisionHelper_Update.apk");
                        Intent intent = new Intent(Intent.ACTION_VIEW);
                        intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(intent);

                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            });
        }

        @JavascriptInterface
        public void exitApp() {
            finish();
        }
    }
}
"""

# Replace static version placeholder with dynamic auto-increment version code
java_content = java_content.replace("private int CURRENT_VERSION = 1;", f"private int CURRENT_VERSION = {version_code};")

with open(os.path.join(build_temp_dir, "src", "com", "decision", "helper", "pro", "MainActivity.java"), "w", encoding="utf-8") as f:
    f.write(java_content)

# Step 4.5: Write GenericFileProvider.java as a separate public class file
provider_content = """package com.decision.helper.pro;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import java.io.File;
import java.io.FileNotFoundException;

public class GenericFileProvider extends ContentProvider {
    @Override
    public boolean onCreate() {
        return true;
    }

    @Override
    public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
        return null;
    }

    @Override
    public String getType(Uri uri) {
        return "application/vnd.android.package-archive";
    }

    @Override
    public Uri insert(Uri uri, ContentValues values) {
        return null;
    }

    @Override
    public int delete(Uri uri, String selection, String[] selectionArgs) {
        return 0;
    }

    @Override
    public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) {
        return 0;
    }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        File file = new File(getContext().getExternalFilesDir(null), uri.getPath());
        return ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY);
    }
}
"""

with open(os.path.join(build_temp_dir, "src", "com", "decision", "helper", "pro", "GenericFileProvider.java"), "w", encoding="utf-8") as f:
    f.write(provider_content)

# Step 5: Write AndroidManifest.xml

manifest_content = f"""<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.decision.helper.pro"
    android:versionCode="{version_code}"
    android:versionName="1.{version_code}">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="34" />

    <application
        android:label="Decision Helper"
        android:icon="@drawable/ic_launcher"
        android:theme="@android:style/Theme.NoTitleBar">
        
        <activity
            android:name=".MainActivity"
            android:label="Decision Helper"
            android:exported="true"
            android:launchMode="singleTask"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        
        <provider
            android:name=".GenericFileProvider"
            android:authorities="com.decision.helper.pro.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true" />
    </application>
</manifest>
"""

with open(os.path.join(build_temp_dir, "AndroidManifest.xml"), "w", encoding="utf-8") as f:
    f.write(manifest_content)

# Step 6: Copy resources and assets
icon_dest = os.path.join(build_temp_dir, "res", "drawable", "ic_launcher.png")
try:
    img = Image.open(os.path.join(app_dir, "app_icon.png"))
    img = img.convert("RGBA")
    img.save(icon_dest, "PNG")
    print("Converted app icon to standard PNG format successfully.")
except Exception as e:
    print("Warning: Could not convert app icon using Pillow, copying directly:", e)
    shutil.copy(os.path.join(app_dir, "app_icon.png"), icon_dest)

shutil.copy(os.path.join(app_dir, "index.html"), os.path.join(build_temp_dir, "assets", "www", "index.html"))
shutil.copy(os.path.join(app_dir, "styles.css"), os.path.join(build_temp_dir, "assets", "www", "styles.css"))
shutil.copy(os.path.join(app_dir, "app.js"), os.path.join(build_temp_dir, "assets", "www", "app.js"))

print("Project template ready. Starting compiler execution...")

# Step 7: Run aapt resource packaging
print("Packaging resources via aapt...")
aapt_args = [
    aapt_exe, "package", "-f", "-m",
    "-J", os.path.join(build_temp_dir, "src"),
    "-M", os.path.join(build_temp_dir, "AndroidManifest.xml"),
    "-S", os.path.join(build_temp_dir, "res"),
    "-I", android_jar
]
subprocess.run(aapt_args, check=True)

# Step 8: Compile Java classes via javac
print("Compiling Java classes via javac...")
javac_args = [
    javac_exe, "-d", os.path.join(build_temp_dir, "obj"),
    "-classpath", android_jar,
    os.path.join(build_temp_dir, "src", "com", "decision", "helper", "pro", "MainActivity.java"),
    os.path.join(build_temp_dir, "src", "com", "decision", "helper", "pro", "GenericFileProvider.java"),
    os.path.join(build_temp_dir, "src", "com", "decision", "helper", "pro", "R.java")
]
subprocess.run(javac_args, check=True)

# Step 9: Convert classes to DEX via d8
print("Converting classes to dex via d8...")
obj_dir = os.path.join(build_temp_dir, "obj", "com", "decision", "helper", "pro")
d8_jar = os.path.join(build_tools_dir, "lib", "d8.jar")
java_exe = os.path.join(jdk_bin_dir, "java.exe")
d8_args = [
    java_exe,
    "-Xmx1024M",
    "-cp", d8_jar,
    "com.android.tools.r8.D8",
    "--lib", android_jar,
    "--output", os.path.join(build_temp_dir, "bin")
] + [os.path.join(obj_dir, f) for f in os.listdir(obj_dir) if f.endswith(".class")]
subprocess.run(d8_args, check=True)

# Step 10: Package unsigned APK
print("Packaging unsigned APK...")
unsigned_apk = os.path.join(build_temp_dir, "bin", "unsigned.apk")
aapt_pack_args = [
    aapt_exe, "package", "-f",
    "-M", os.path.join(build_temp_dir, "AndroidManifest.xml"),
    "-S", os.path.join(build_temp_dir, "res"),
    "-A", os.path.join(build_temp_dir, "assets"),
    "-I", android_jar,
    "-F", unsigned_apk
]
subprocess.run(aapt_pack_args, check=True)

# Step 11: Add classes.dex into APK zip
print("Adding classes.dex into APK...")
classes_dex_path = os.path.join(build_temp_dir, "bin", "classes.dex")
with zipfile.ZipFile(unsigned_apk, 'a') as zipf:
    zipf.write(classes_dex_path, "classes.dex")

# Step 11.5: Align APK via zipalign for modern Android compatibility
print("Aligning APK via zipalign...")
aligned_apk = os.path.join(build_temp_dir, "bin", "aligned.apk")
zipalign_args = [
    zipalign_exe, "-f", "-p", "4",
    unsigned_apk, aligned_apk
]
subprocess.run(zipalign_args, check=True)

# Step 12: Generate local keystore
print("Generating local self-signed key...")
keystore_path = os.path.join(compilers_dir, "release.keystore")
if not os.path.exists(keystore_path):
    keytool_args = [
        keytool_exe, "-genkeypair", "-v",
        "-keystore", keystore_path,
        "-alias", "mykey",
        "-keyalg", "RSA",
        "-keysize", "2048",
        "-validity", "10000",
        "-dname", "CN=DecisionHelper, O=DecisionHelper, C=US",
        "-storepass", "password",
        "-keypass", "password"
    ]
    subprocess.run(keytool_args, check=True)
else:
    print("Found persistent signing keystore. Reusing it for update compatibility.")

# Step 13: Sign aligned APK via apksigner
print("Signing APK via apksigner...")
apksigner_jar = os.path.join(build_tools_dir, "lib", "apksigner.jar")
apksigner_args = [
    java_exe,
    "-jar", apksigner_jar,
    "sign",
    "--ks", keystore_path,
    "--ks-key-alias", "mykey",
    "--ks-pass", "pass:password",
    "--key-pass", "pass:password",
    "--out", output_apk,
    aligned_apk
]
subprocess.run(apksigner_args, check=True)

# Step 14: Cleanup temp build files
shutil.rmtree(build_temp_dir)
# Cleanup downloaded zip to save disk space
if os.path.exists(jdk_zip):
    os.remove(jdk_zip)

print(f"Success! Standing native APK built successfully at: {output_apk}")

def push_update_to_github(apk_path, version_code):
    import json
    secrets_file = os.path.join(app_dir, "secrets.json")
    release_notes_file = os.path.join(app_dir, "release_notes.txt")
    
    # Initialize release_notes.txt if it doesn't exist
    if not os.path.exists(release_notes_file):
        with open(release_notes_file, "w", encoding="utf-8") as f:
            f.write("- Added custom 24-hour reminder option\n- Added visual What's New release notes view\n")

    if not os.path.exists(secrets_file):
        print("\nWarning: secrets.json not found. Skipping auto-updater upload.")
        return

    try:
        with open(secrets_file, "r", encoding="utf-8") as f:
            secrets = json.load(f)
        token = secrets.get("github_token", "").strip()
        gist_id = secrets.get("gist_id", "").strip()
        username = secrets.get("github_username", "").strip()
        repo = secrets.get("github_repository", "").strip()

        if not token or token == "PASTE_YOUR_GITHUB_TOKEN_HERE":
            print("\nWarning: No valid GitHub token in secrets.json. Skipping auto-updater upload.")
            return

        # Calculate file size
        file_bytes = os.path.getsize(apk_path)
        file_size_mb = f"{file_bytes / (1024 * 1024):.2f} MB"

        # Read release notes
        whats_new = []
        if os.path.exists(release_notes_file):
            with open(release_notes_file, "r", encoding="utf-8") as f:
                for line in f:
                    val = line.strip().lstrip("-").strip()
                    if val:
                        whats_new.append(val)
        if not whats_new:
            whats_new = ["Bug fixes and performance improvements."]

        print(f"\n[Updater] Initiating automated upload for Version 1.{version_code} ({file_size_mb})...")

        # 1. Verify/Create GitHub Repository
        repo_url = f"https://api.github.com/repos/{username}/{repo}"
        req_repo = urllib.request.Request(repo_url)
        req_repo.add_header("Authorization", f"token {token}")
        req_repo.add_header("User-Agent", "DecisionHelper-Updater")
        
        repo_exists = False
        try:
            with urllib.request.urlopen(req_repo) as r:
                repo_exists = True
        except urllib.error.HTTPError as e:
            if e.code == 404:
                print(f"[Updater] Repository '{repo}' not found. Creating it on your account...")
                create_url = "https://api.github.com/user/repos"
                create_payload = json.dumps({"name": repo, "private": False, "auto_init": True}).encode("utf-8")
                req_create = urllib.request.Request(create_url, data=create_payload)
                req_create.add_header("Authorization", f"token {token}")
                req_create.add_header("Content-Type", "application/json")
                req_create.add_header("User-Agent", "DecisionHelper-Updater")
                with urllib.request.urlopen(req_create) as r:
                    repo_exists = True
                    print("[Updater] Repository created successfully.")
            else:
                print(f"[Updater] Repository verification failed: {e.reason}")

        if not repo_exists:
            print("[Updater] Failed to verify or create repository. Skipping upload.")
            return

        # 2. Create GitHub Release
        release_url = f"https://api.github.com/repos/{username}/{repo}/releases"
        release_payload = json.dumps({
            "tag_name": f"v1.{version_code}",
            "name": f"Release 1.{version_code}",
            "body": f"Automated OTA release for Version 1.{version_code}.",
            "draft": False,
            "prerelease": False
        }).encode("utf-8")

        req_release = urllib.request.Request(release_url, data=release_payload)
        req_release.add_header("Authorization", f"token {token}")
        req_release.add_header("Content-Type", "application/json")
        req_release.add_header("User-Agent", "DecisionHelper-Updater")
        
        with urllib.request.urlopen(req_release) as r:
            res_release = json.loads(r.read().decode("utf-8"))
            release_id = res_release["id"]
            upload_url_template = res_release["upload_url"]

        # 3. Upload APK binary asset to the release
        upload_url = upload_url_template.split("{")[0] + f"?name=DecisionHelper.apk"
        with open(apk_path, "rb") as f:
            apk_bytes = f.read()

        req_upload = urllib.request.Request(upload_url, data=apk_bytes)
        req_upload.add_header("Authorization", f"token {token}")
        req_upload.add_header("Content-Type", "application/vnd.android.package-archive")
        req_upload.add_header("User-Agent", "DecisionHelper-Updater")
        
        apk_download_url = None
        with urllib.request.urlopen(req_upload) as r:
            res_upload = json.loads(r.read().decode("utf-8"))
            apk_download_url = res_upload["browser_download_url"]
            print(f"[Updater] APK asset uploaded to release. URL: {apk_download_url}")

        # 4. Update the Gist check file (gistfile1.txt)
        gist_url = f"https://api.github.com/gists/{gist_id}"
        gist_payload = json.dumps({
            "files": {
                "gistfile1.txt": {
                    "content": json.dumps({
                        "versionCode": version_code,
                        "versionName": f"1.{version_code}",
                        "fileSize": file_size_mb,
                        "whatsNew": whats_new,
                        "apkUrl": apk_download_url
                    }, indent=4)
                }
            }
        }).encode("utf-8")

        req_gist = urllib.request.Request(gist_url, data=gist_payload, method="PATCH")
        req_gist.add_header("Authorization", f"token {token}")
        req_gist.add_header("Content-Type", "application/json")
        req_gist.add_header("User-Agent", "DecisionHelper-Updater")
        
        with urllib.request.urlopen(req_gist) as r:
            print("[Updater] Gist bulletin updated successfully! OTA notification is now live globally.")

    except Exception as e:
        print(f"\n[Updater] Error publishing release: {e}")

push_update_to_github(output_apk, version_code)
