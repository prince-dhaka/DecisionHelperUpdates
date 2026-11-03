const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const appDir = __dirname;
const compilersDir = path.join(appDir, 'compilers');
const sdkDir = process.env.ANDROID_HOME || 'D:\\Android\\Sdk';
const buildToolsDir = path.join(sdkDir, 'build-tools', '34.0.0');
const androidJar = path.join(sdkDir, 'platforms', 'android-34', 'android.jar');

const aaptExe = path.join(buildToolsDir, 'aapt.exe');
const zipalignExe = path.join(buildToolsDir, 'zipalign.exe');
const apksignerJar = path.join(buildToolsDir, 'lib', 'apksigner.jar');
const d8Jar = path.join(buildToolsDir, 'lib', 'd8.jar');

// Locate Java binaries
const jdkBin = 'C:\\Program Files\\Microsoft\\jdk-17.0.20.8-hotspot\\bin';
const javacExe = path.join(jdkBin, 'javac.exe');
const javaExe = path.join(jdkBin, 'java.exe');
const jarExe = path.join(jdkBin, 'jar.exe');
const keytoolExe = path.join(jdkBin, 'keytool.exe');

const buildTempDir = path.join(appDir, 'build_temp');
const outputApk = path.join(appDir, 'DecisionHelper.apk');

console.log('--- Decision Helper Android Build Pipeline ---');
console.log('Using Android SDK:', sdkDir);
console.log('Using JDK:', jdkBin);

// 1. Version increment
const versionFile = path.join(appDir, 'version.txt');
let versionCode = 1;
if (fs.existsSync(versionFile)) {
    try {
        versionCode = parseInt(fs.readFileSync(versionFile, 'utf8').trim(), 10) + 1;
    } catch (e) {
        versionCode = 1;
    }
}
fs.writeFileSync(versionFile, versionCode.toString(), 'utf8');
console.log(`Building Version Code: ${versionCode} (v1.${versionCode})`);

// 2. Setup build_temp structure
if (fs.existsSync(buildTempDir)) {
    fs.rmSync(buildTempDir, { recursive: true, force: true });
}
const srcPkgDir = path.join(buildTempDir, 'src', 'com', 'decision', 'helper', 'pro');
const resDrawableDir = path.join(buildTempDir, 'res', 'drawable');
const assetsWwwDir = path.join(buildTempDir, 'assets', 'www');
const objDir = path.join(buildTempDir, 'obj');
const binDir = path.join(buildTempDir, 'bin');

fs.mkdirSync(srcPkgDir, { recursive: true });
fs.mkdirSync(resDrawableDir, { recursive: true });
fs.mkdirSync(assetsWwwDir, { recursive: true });
fs.mkdirSync(objDir, { recursive: true });
fs.mkdirSync(binDir, { recursive: true });

// 3. Write MainActivity.java
const mainActivityJava = `package com.decision.helper.pro;

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
    private int CURRENT_VERSION = ${versionCode};

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        
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
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);
        
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
`;
fs.writeFileSync(path.join(srcPkgDir, 'MainActivity.java'), mainActivityJava, 'utf8');

// 4. Write GenericFileProvider.java
const genericFileProviderJava = `package com.decision.helper.pro;

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
`;
fs.writeFileSync(path.join(srcPkgDir, 'GenericFileProvider.java'), genericFileProviderJava, 'utf8');

// 5. Write AndroidManifest.xml
const androidManifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.decision.helper.pro"
    android:versionCode="${versionCode}"
    android:versionName="1.${versionCode}">

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
`;
fs.writeFileSync(path.join(buildTempDir, 'AndroidManifest.xml'), androidManifestXml, 'utf8');

// 6. Copy web assets and icon
fs.copyFileSync(path.join(appDir, 'app_icon.png'), path.join(resDrawableDir, 'ic_launcher.png'));
fs.copyFileSync(path.join(appDir, 'index.html'), path.join(assetsWwwDir, 'index.html'));
fs.copyFileSync(path.join(appDir, 'styles.css'), path.join(assetsWwwDir, 'styles.css'));
fs.copyFileSync(path.join(appDir, 'app.js'), path.join(assetsWwwDir, 'app.js'));

// 7. aapt package resources
console.log('[1/7] Packaging resources with aapt...');
execSync(`"${aaptExe}" package -f -m -J "${path.join(buildTempDir, 'src')}" -M "${path.join(buildTempDir, 'AndroidManifest.xml')}" -S "${path.join(buildTempDir, 'res')}" -I "${androidJar}"`, { stdio: 'inherit' });

// 8. Compile Java classes
console.log('[2/7] Compiling Java classes with javac...');
const javaFiles = [
    `"${path.join(srcPkgDir, 'MainActivity.java')}"`,
    `"${path.join(srcPkgDir, 'GenericFileProvider.java')}"`,
    `"${path.join(srcPkgDir, 'R.java')}"`
].join(' ');
execSync(`"${javacExe}" -d "${objDir}" -classpath "${androidJar}" ${javaFiles}`, { stdio: 'inherit' });

// 9. Convert classes to dex via d8
console.log('[3/7] Compiling classes to DEX via d8...');
const classFiles = fs.readdirSync(path.join(objDir, 'com', 'decision', 'helper', 'pro'))
    .filter(f => f.endsWith('.class'))
    .map(f => `"${path.join(objDir, 'com', 'decision', 'helper', 'pro', f)}"`)
    .join(' ');
execSync(`"${javaExe}" -Xmx1024M -cp "${d8Jar}" com.android.tools.r8.D8 --lib "${androidJar}" --output "${binDir}" ${classFiles}`, { stdio: 'inherit' });

// 10. aapt build unsigned APK
console.log('[4/7] Packaging unsigned APK with aapt...');
const unsignedApk = path.join(binDir, 'unsigned.apk');
execSync(`"${aaptExe}" package -f -M "${path.join(buildTempDir, 'AndroidManifest.xml')}" -S "${path.join(buildTempDir, 'res')}" -A "${path.join(buildTempDir, 'assets')}" -I "${androidJar}" -F "${unsignedApk}"`, { stdio: 'inherit' });

// 11. Add classes.dex into APK
console.log('[5/7] Adding classes.dex to APK...');
execSync(`"${jarExe}" uf "${unsignedApk}" -C "${binDir}" classes.dex`, { stdio: 'inherit' });

// 12. zipalign
console.log('[6/7] Aligning APK with zipalign...');
const alignedApk = path.join(binDir, 'aligned.apk');
execSync(`"${zipalignExe}" -f -p 4 "${unsignedApk}" "${alignedApk}"`, { stdio: 'inherit' });

// 13. apksigner
console.log('[7/7] Signing APK with apksigner...');
const keystorePath = path.join(compilersDir, 'release.keystore');
if (!fs.existsSync(keystorePath)) {
    console.log('Generating signing keystore...');
    execSync(`"${keytoolExe}" -genkeypair -v -keystore "${keystorePath}" -alias mykey -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=DecisionHelper, O=DecisionHelper, C=US" -storepass password -keypass password`, { stdio: 'inherit' });
}
execSync(`"${javaExe}" -jar "${apksignerJar}" sign --ks "${keystorePath}" --ks-key-alias mykey --ks-pass pass:password --key-pass pass:password --out "${outputApk}" "${alignedApk}"`, { stdio: 'inherit' });

// Cleanup temp directory
fs.rmSync(buildTempDir, { recursive: true, force: true });

const apkStats = fs.statSync(outputApk);
const apkSizeMb = (apkStats.size / (1024 * 1024)).toFixed(2);
console.log(`\n==============================================`);
console.log(`SUCCESS! Android APK built successfully!`);
console.log(`Output: ${outputApk}`);
console.log(`Size: ${apkSizeMb} MB (${apkStats.size} bytes)`);
console.log(`Version: 1.${versionCode}`);
console.log(`==============================================\n`);

// 14. Automated GitHub Release & Gist OTA Update
async function publishOtaUpdate() {
    const secretsPath = path.join(appDir, 'secrets.json');
    if (!fs.existsSync(secretsPath)) {
        console.log('[Updater] secrets.json not found, skipping OTA publishing.');
        return;
    }
    const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
    const token = secrets.github_token;
    const gistId = secrets.gist_id;
    const username = secrets.github_username;
    const repo = secrets.github_repository;

    if (!token || !gistId || !username || !repo) {
        console.log('[Updater] Missing GitHub credentials in secrets.json.');
        return;
    }

    console.log(`\n[Updater] Initiating automated release & Gist OTA update for Version 1.${versionCode}...`);

    const request = (options, postData) => new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ statusCode: res.statusCode, headers: res.headers, body: JSON.parse(data) });
                } catch {
                    resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
                }
            });
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });

    let release;
    const releasePayload = JSON.stringify({
        tag_name: `v1.${versionCode}`,
        name: `Release 1.${versionCode}`,
        body: `Automated OTA release for Version 1.${versionCode}.\n\nFeatures:\n- Refined mobile layout & typography\n- Simple, Useful, Premium design polish\n- Lock security & chat persistence`,
        draft: false,
        prerelease: false
    });

    try {
        const createRelRes = await request({
            hostname: 'api.github.com',
            path: `/repos/${username}/${repo}/releases`,
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'User-Agent': 'DecisionHelper-BuildPipeline',
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(releasePayload)
            }
        }, releasePayload);

        if (createRelRes.statusCode === 201) {
            release = createRelRes.body;
            console.log(`[Updater] GitHub Release created: ${release.html_url}`);
        } else {
            const getRelRes = await request({
                hostname: 'api.github.com',
                path: `/repos/${username}/${repo}/releases/tags/v1.${versionCode}`,
                method: 'GET',
                headers: {
                    'Authorization': `token ${token}`,
                    'User-Agent': 'DecisionHelper-BuildPipeline'
                }
            });
            release = getRelRes.body;
            console.log(`[Updater] Using existing release: ${release.html_url}`);
        }

        if (release && release.upload_url) {
            const uploadBase = release.upload_url.split('{')[0];
            const apkBuffer = fs.readFileSync(outputApk);
            const urlObj = new URL(`${uploadBase}?name=DecisionHelper.apk`);

            if (release.assets && release.assets.length > 0) {
                for (const asset of release.assets) {
                    if (asset.name === 'DecisionHelper.apk') {
                        console.log(`[Updater] Deleting older asset id ${asset.id}...`);
                        await request({
                            hostname: 'api.github.com',
                            path: `/repos/${username}/${repo}/releases/assets/${asset.id}`,
                            method: 'DELETE',
                            headers: {
                                'Authorization': `token ${token}`,
                                'User-Agent': 'DecisionHelper-BuildPipeline'
                            }
                        });
                    }
                }
            }

            console.log('[Updater] Uploading APK asset...');
            const uploadRes = await new Promise((resolve, reject) => {
                const upReq = https.request({
                    hostname: urlObj.hostname,
                    path: urlObj.pathname + urlObj.search,
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${token}`,
                        'User-Agent': 'DecisionHelper-BuildPipeline',
                        'Content-Type': 'application/vnd.android.package-archive',
                        'Content-Length': apkBuffer.length
                    }
                }, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
                });
                upReq.on('error', reject);
                upReq.write(apkBuffer);
                upReq.end();
            });

            console.log(`[Updater] APK asset upload status: ${uploadRes.statusCode}`);
        }

        const apkDownloadUrl = `https://github.com/${username}/${repo}/releases/download/v1.${versionCode}/DecisionHelper.apk`;

        const whatsNewList = [
            "Fixed mobile title text wrapping and multi-line breaks",
            "Clean mobile header hierarchy and balanced spacing",
            "Floating AI chat bubble repositioned above bottom footer",
            "Unified Advantages and Disadvantages terminology across tabs",
            "Persistent chat history and secured locked private vault"
        ];

        const gistPayload = JSON.stringify({
            files: {
                "gistfile1.txt": {
                    content: JSON.stringify({
                        versionCode: versionCode,
                        versionName: `1.${versionCode}`,
                        fileSize: `${apkSizeMb} MB`,
                        whatsNew: whatsNewList,
                        apkUrl: apkDownloadUrl
                    }, null, 4)
                }
            }
        });

        console.log('[Updater] Updating Gist bulletin for in-app OTA notifications...');
        const gistRes = await request({
            hostname: 'api.github.com',
            path: `/gists/${gistId}`,
            method: 'PATCH',
            headers: {
                'Authorization': `token ${token}`,
                'User-Agent': 'DecisionHelper-BuildPipeline',
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(gistPayload)
            }
        }, gistPayload);

        if (gistRes.statusCode === 200) {
            console.log('[Updater] SUCCESS! Gist bulletin updated. OTA update is now LIVE globally!');
        } else {
            console.log(`[Updater] Gist update response status: ${gistRes.statusCode}`);
        }
    } catch (err) {
        console.error('[Updater] Error publishing OTA release:', err);
    }
}

publishOtaUpdate();

