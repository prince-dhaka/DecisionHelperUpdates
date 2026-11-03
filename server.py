import os
import sys

if sys.stdout is None or sys.stderr is None:
    class NullWriter:
        def write(self, s): pass
        def flush(self): pass

    if sys.stdout is None:
        sys.stdout = NullWriter()
    if sys.stderr is None:
        sys.stderr = NullWriter()

import json
import re
import shutil
import urllib.parse
import urllib.request
import urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = int(os.environ.get("PORT", 5000))
APP_DIR = os.path.dirname(os.path.abspath(__file__))

try:
    config_path = os.path.join(APP_DIR, "config.json")
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)
            if "port" in config:
                PORT = int(config["port"])
except:
    pass

DECISIONS_DIR = "D:\\Decisions"

def sanitize_filename(name):
    # Strip illegal characters and block path traversal sequences
    name = re.sub(r'[\\/*?:"<>|]', '', name)
    name = re.sub(r'\.\.+', '', name)
    return name.strip()

def get_item_text_weight(item):
    if isinstance(item, dict):
        return item.get("text", "").strip(), item.get("weight", 1)
    return str(item).strip(), 1

def write_markdown_file(path, topic, cat_name, pros, cons, password_hash=None):
    temp_path = path + ".tmp"
    try:
        with open(temp_path, 'w', encoding='utf-8') as f:
            f.write(f"# Decision: {topic} ({cat_name})\n")
            if password_hash:
                f.write(f"<!-- password_hash: {password_hash} -->\n")
            f.write("\n## Advantages\n")
            for i, pro in enumerate(pros):
                txt, wt = get_item_text_weight(pro)
                if txt:
                    if wt > 1:
                        f.write(f"{i+1}. [{wt}x] {txt}\n")
                    else:
                        f.write(f"{i+1}. {txt}\n")
            f.write("\n## Disadvantages\n")
            for i, con in enumerate(cons):
                txt, wt = get_item_text_weight(con)
                if txt:
                    if wt > 1:
                        f.write(f"{i+1}. [{wt}x] {txt}\n")
                    else:
                        f.write(f"{i+1}. {txt}\n")
        # Atomic rename/replace to prevent corruption
        os.replace(temp_path, path)
    except Exception as e:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass
        raise e

def ensure_default_data():
    if not os.path.exists(DECISIONS_DIR):
        os.makedirs(DECISIONS_DIR)
    
    # Check if there are any directories inside Decisions
    has_dirs = False
    for item in os.listdir(DECISIONS_DIR):
        if os.path.isdir(os.path.join(DECISIONS_DIR, item)):
            has_dirs = True
            break
            
    if not has_dirs:
        # Create empty default directories
        os.makedirs(os.path.join(DECISIONS_DIR, "Drafts"), exist_ok=True)
        os.makedirs(os.path.join(DECISIONS_DIR, "Career"), exist_ok=True)
        os.makedirs(os.path.join(DECISIONS_DIR, "Relationships"), exist_ok=True)
        os.makedirs(os.path.join(DECISIONS_DIR, "Health"), exist_ok=True)

def load_state_from_disk():
    ensure_default_data()
    
    categories = []
    drafts_cat = {"name": "Drafts", "decisions": []}
    categories.append(drafts_cat)
    
    # Read categories from disk
    for cat_name in sorted(os.listdir(DECISIONS_DIR)):
        if cat_name == "backups":
            continue
        cat_path = os.path.join(DECISIONS_DIR, cat_name)
        if os.path.isdir(cat_path):
            decisions = []
            for file_name in os.listdir(cat_path):
                if file_name.endswith('.md'):
                    dec_path = os.path.join(cat_path, file_name)
                    dec_id = "dec_" + str(int(os.path.getmtime(dec_path) * 1000))
                    topic = file_name[:-3] # strip .md extension
                    pros = []
                    cons = []
                    password_hash = ""
                    
                    try:
                        with open(dec_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                        
                        pw_match = re.search(r'<!-- password_hash:\s*(.*?)\s*-->', content)
                        if pw_match:
                            password_hash = pw_match.group(1).strip()
                        
                        # Parse Markdown structured lists
                        adv_sec = re.search(r'## Advantages\n(.*?)(?=\n## Disadvantages|\Z)', content, re.DOTALL)
                        dis_sec = re.search(r'## Disadvantages\n(.*)', content, re.DOTALL)
                        
                        if adv_sec:
                            for line in adv_sec.group(1).splitlines():
                                line_clean = re.sub(r'^\d+\.\s*', '', line).strip()
                                if line_clean:
                                    # Parse weight tag e.g. [2x] text
                                    m = re.match(r'^\[(\d+)x\]\s*(.*)', line_clean)
                                    if m:
                                        pros.append({"text": m.group(2).strip(), "weight": int(m.group(1))})
                                    else:
                                        pros.append({"text": line_clean, "weight": 1})
                        if dis_sec:
                            for line in dis_sec.group(1).splitlines():
                                line_clean = re.sub(r'^\d+\.\s*', '', line).strip()
                                if line_clean:
                                    m = re.match(r'^\[(\d+)x\]\s*(.*)', line_clean)
                                    if m:
                                        cons.append({"text": m.group(2).strip(), "weight": int(m.group(1))})
                                    else:
                                        cons.append({"text": line_clean, "weight": 1})
                    except Exception as e:
                        print("Error parsing file:", file_name, e)
                        
                    if not pros: pros = ['']
                    if not cons: cons = ['']
                    
                    decisions.append({
                        "id": dec_id,
                        "topic": topic,
                        "pros": pros,
                        "cons": cons,
                        "passwordHash": password_hash
                    })
            
            if cat_name == 'Drafts':
                drafts_cat["decisions"] = decisions
            else:
                categories.append({
                    "name": cat_name,
                    "decisions": decisions
                })
                
    # Ensure drafts has at least one decision
    if not drafts_cat["decisions"]:
        drafts_cat["decisions"].append({
            "id": "dec_draft_default",
            "topic": "",
            "pros": [""],
            "cons": [""]
        })
        
    # Return formatted state
    return {"categories": categories}

def is_reserved_name(name):
    # Windows reserved filenames
    reserved = {"CON", "PRN", "AUX", "NUL",
                "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
                "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"}
    return name.upper() in reserved

def validate_state(state):
    if not isinstance(state, dict):
        return False
    if "categories" not in state or not isinstance(state["categories"], list):
        return False
    for cat in state["categories"]:
        if not isinstance(cat, dict) or "name" not in cat or "decisions" not in cat:
            return False
        cat_name = cat["name"].strip()
        # Block empty categories, path traversals, and reserved words
        if not cat_name or is_reserved_name(cat_name) or ".." in cat_name or "/" in cat_name or "\\" in cat_name:
            return False
        if not isinstance(cat["decisions"], list):
            return False
        for dec in cat["decisions"]:
            if not isinstance(dec, dict) or "topic" not in dec or "pros" not in dec or "cons" not in dec:
                return False
            topic = dec["topic"].strip()
            # Block Windows reserved filenames and directory traversals
            if is_reserved_name(topic) or ".." in topic or "/" in topic or "\\" in topic:
                return False
            if not isinstance(dec["pros"], list) or not isinstance(dec["cons"], list):
                return False
    return True

def save_state_to_disk(state):
    if not validate_state(state):
        raise ValueError("Invalid state payload structure")

    if not os.path.exists(DECISIONS_DIR):
        os.makedirs(DECISIONS_DIR)
        
    # Write a timestamped full JSON backup of the active state payload (Item 46)
    backups_dir = os.path.join(DECISIONS_DIR, "backups")
    os.makedirs(backups_dir, exist_ok=True)
    import time
    timestamp = int(time.time())
    backup_file = os.path.join(backups_dir, f"state_backup_{timestamp}.json")
    try:
        with open(backup_file, 'w', encoding='utf-8') as bf:
            json.dump(state, bf, indent=4, ensure_ascii=False)
        # Keep only the latest 20 backup files
        backup_files = sorted(
            [os.path.join(backups_dir, f) for f in os.listdir(backups_dir) if f.startswith("state_backup_") and f.endswith(".json")],
            key=os.path.getmtime
        )
        while len(backup_files) >= 20:
            os.remove(backup_files.pop(0))
    except Exception as e:
        print("Error handling backup:", e)
        
    # Clear out old .md files inside our mapped categories to prevent orphaned files
    active_cats = {cat["name"] for cat in state["categories"]}
    
    for cat_name in os.listdir(DECISIONS_DIR):
        if cat_name == "backups":
            continue
        cat_path = os.path.join(DECISIONS_DIR, cat_name)
        if os.path.isdir(cat_path):
            if cat_name not in active_cats:
                try:
                    shutil.rmtree(cat_path)
                except Exception as e:
                    print("Error deleting folder:", cat_path, e)
            else:
                for file_name in os.listdir(cat_path):
                    if file_name.endswith('.md'):
                        try:
                            os.remove(os.path.join(cat_path, file_name))
                        except Exception as e:
                            print("Error deleting file:", file_name, e)
                              
    # Save the new categories and decisions as folders and files
    for cat in state["categories"]:
        cat_name = cat["name"]
        cat_path = os.path.join(DECISIONS_DIR, cat_name)
        os.makedirs(cat_path, exist_ok=True)
        
        for dec in cat["decisions"]:
            topic = dec["topic"].strip()
            # Skip empty/untitled topics entirely - do not write them to disk
            if not topic:
                continue
                
            file_name = sanitize_filename(topic) + ".md"
            file_path = os.path.join(cat_path, file_name)
            
            # Write markdown structure
            write_markdown_file(file_path, topic, cat_name, dec["pros"], dec["cons"], dec.get("passwordHash"))

def auto_bundle():
    try:
        index_path = os.path.join(APP_DIR, "index.html")
        css_path = os.path.join(APP_DIR, "styles.css")
        js_path = os.path.join(APP_DIR, "app.js")
        out_path = os.path.join(APP_DIR, "DecisionHelper.html")
        
        if not (os.path.exists(index_path) and os.path.exists(css_path) and os.path.exists(js_path)):
            return
            
        mtime_index = os.path.getmtime(index_path)
        mtime_css = os.path.getmtime(css_path)
        mtime_js = os.path.getmtime(js_path)
        
        mtime_out = 0
        if os.path.exists(out_path):
            mtime_out = os.path.getmtime(out_path)
            
        if max(mtime_index, mtime_css, mtime_js) > mtime_out:
            with open(index_path, "r", encoding="utf-8") as f:
                html = f.read()
            with open(css_path, "r", encoding="utf-8") as f:
                css = f.read()
            with open(js_path, "r", encoding="utf-8") as f:
                js = f.read()
                
            css_tag = f"<style>\n{css}\n</style>"
            css_match = re.search(r'<link rel="stylesheet" href="styles.css[^"]*">', html)
            if css_match:
                html = html.replace(css_match.group(0), css_tag)
                
            js_tag = f"<script>\n{js}\n</script>"
            js_match = re.search(r'<script src="app.js[^"]*"></script>', html)
            if js_match:
                html = html.replace(js_match.group(0), js_tag)
                
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(html)
    except Exception as e:
        pass

class DecisionServer(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def end_headers(self):
        # CORS Lock: Allow only the local origin
        self.send_header('Access-Control-Allow-Origin', 'http://127.0.0.1:5000')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # Disable caching to prevent loading stale resources
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        # Security Hardening Headers
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        auto_bundle()
        parsed_url = urllib.parse.urlparse(self.path)
        
        # Load API State
        if parsed_url.path == '/api/load':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            state = load_state_from_disk()
            self.wfile.write(json.dumps(state).encode('utf-8'))
            return
            
        # Static file routing
        file_path = parsed_url.path.lstrip('/')
        if not file_path:
            file_path = 'index.html'
            
        # Path traversal guard
        full_path = os.path.abspath(os.path.join(APP_DIR, file_path))
        if not full_path.startswith(os.path.abspath(APP_DIR)):
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b"Forbidden: Directory traversal blocked")
            return

        if os.path.exists(full_path) and os.path.isfile(full_path):
            self.send_response(200)
            
            # Content types
            if file_path.endswith('.html'):
                self.send_header('Content-Type', 'text/html')
            elif file_path.endswith('.css'):
                self.send_header('Content-Type', 'text/css')
            elif file_path.endswith('.js'):
                self.send_header('Content-Type', 'application/javascript')
            elif file_path.endswith('.png'):
                self.send_header('Content-Type', 'image/png')
            else:
                self.send_header('Content-Type', 'application/octet-stream')
                
            self.end_headers()
            with open(full_path, 'rb') as f:
                self.wfile.write(f.read())
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"File not found")

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        
        # Save API State
        if parsed_url.path == '/api/save':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                state = json.loads(post_data.decode('utf-8'))
                save_state_to_disk(state)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode('utf-8'))
        
        # AI Suggestions API
        elif parsed_url.path == '/api/suggest':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                payload = json.loads(post_data.decode('utf-8'))
                topic = payload.get("topic", "").strip()
                if not topic:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "Topic cannot be empty"}).encode('utf-8'))
                    return
                
                # Fetch API key
                gemini_key = os.environ.get("GEMINI_API_KEY")
                if not gemini_key:
                    secrets_path = os.path.join(APP_DIR, "secrets.json")
                    if os.path.exists(secrets_path):
                        try:
                            with open(secrets_path, "r", encoding="utf-8") as sf:
                                secrets_data = json.load(sf)
                                gemini_key = secrets_data.get("gemini_api_key")
                        except Exception as e:
                            print("Error reading secrets.json:", e)
                
                if not gemini_key or gemini_key == "PASTE_YOUR_GEMINI_API_KEY_HERE":
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "error": "Gemini API key is not configured. Please paste your key in secrets.json to enable AI suggestions."
                    }).encode('utf-8'))
                    return
                
                
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
                
                prompt = (
                    "You are a neutral Decision Counselor. Suggest a balanced list of advantages (pros) and disadvantages (cons) "
                    f"for the following topic: '{topic}'.\n\n"
                    "Your response MUST be a valid JSON object matching this schema exactly:\n"
                    "{\n"
                    "  \"pros\": [string, string, ...],\n"
                    "  \"cons\": [string, string, ...]\n"
                    "}\n"
                    "Do not include any markdown tags, trailing commas, or other text outside the JSON object. "
                    "Provide up to 8 items in each list. Each item should be a concise, realistic, and complete sentence."
                )
                
                api_payload = {
                    "contents": [{
                        "parts": [{
                            "text": prompt
                        }]
                    }],
                    "generationConfig": {
                        "responseMimeType": "application/json"
                    }
                }
                
                req = urllib.request.Request(
                    url,
                    data=json.dumps(api_payload).encode('utf-8'),
                    headers={'Content-Type': 'application/json'},
                    method='POST'
                )
                
                with urllib.request.urlopen(req, timeout=15) as response:
                    res_data = json.loads(response.read().decode('utf-8'))
                    
                try:
                    text_content = res_data['candidates'][0]['content']['parts'][0]['text']
                    if "```" in text_content:
                        text_content = re.sub(r'^```[a-zA-Z]*\s*', '', text_content)
                        text_content = re.sub(r'\s*```$', '', text_content)
                    
                    suggestions = json.loads(text_content.strip())
                    
                    if not isinstance(suggestions, dict):
                        raise ValueError("Gemini did not return a dictionary")
                    if "pros" not in suggestions:
                        suggestions["pros"] = []
                    if "cons" not in suggestions:
                        suggestions["cons"] = []
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(suggestions).encode('utf-8'))
                    
                except Exception as parse_err:
                    print("Error parsing Gemini API response text:", parse_err, "Raw response:", res_data)
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": f"Failed to parse Gemini response: {str(parse_err)}"}).encode('utf-8'))
                    
            except urllib.error.HTTPError as http_err:
                err_body = http_err.read().decode('utf-8')
                print("Gemini API HTTP Error:", http_err.code, err_body)
                self.send_response(http_err.code)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Gemini API returned error: {http_err.reason}"}).encode('utf-8'))
            except Exception as e:
                print("Error handling /api/suggest:", e)
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

        # AI Chat API
        elif parsed_url.path == '/api/chat':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                payload = json.loads(post_data.decode('utf-8'))
                topic = payload.get("topic", "").strip()
                pros = payload.get("pros", [])
                cons = payload.get("cons", [])
                suggested_pros = payload.get("suggested_pros", [])
                suggested_cons = payload.get("suggested_cons", [])
                history = payload.get("history", []) # List of {"role": "user"|"model", "text": string}
                message = payload.get("message", "").strip()
                
                if not message:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "Message cannot be empty"}).encode('utf-8'))
                    return
                
                # Fetch API key
                gemini_key = os.environ.get("GEMINI_API_KEY")
                if not gemini_key:
                    secrets_path = os.path.join(APP_DIR, "secrets.json")
                    if os.path.exists(secrets_path):
                        try:
                            with open(secrets_path, "r", encoding="utf-8") as sf:
                                secrets_data = json.load(sf)
                                gemini_key = secrets_data.get("gemini_api_key")
                        except Exception as e:
                            print("Error reading secrets.json:", e)
                
                if not gemini_key or gemini_key == "PASTE_YOUR_GEMINI_API_KEY_HERE":
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "error": "Gemini API key is not configured. Please paste your key in secrets.json to enable AI chat."
                    }).encode('utf-8'))
                    return
                
                # Format current pros/cons for context
                pros_str = "\n".join([f"- {get_item_text_weight(p)[0]} (Weight: {get_item_text_weight(p)[1]})" for p in pros if get_item_text_weight(p)[0]])
                cons_str = "\n".join([f"- {get_item_text_weight(c)[0]} (Weight: {get_item_text_weight(c)[1]})" for c in cons if get_item_text_weight(c)[0]])
                
                sugg_pros_str = "\n".join([f"- {p}" for p in suggested_pros])
                sugg_cons_str = "\n".join([f"- {c}" for c in suggested_cons])
                
                system_instruction = (
                    "You are a helpful, neutral, and objective Decision Counselor Chat Assistant. "
                    "The user is evaluating a decision on the topic described below. You must help them think through "
                    "trade-offs, clarify points, evaluate weights, or suggest new angles, but never make the decision for them.\n\n"
                    f"Decision Topic: '{topic}'\n\n"
                    "Current Advantages (Pros) on the workspace:\n"
                    f"{pros_str or 'None yet'}\n\n"
                    "Current Disadvantages (Cons) on the workspace:\n"
                    f"{cons_str or 'None yet'}\n\n"
                    "AI Suggestions shown to the user in this session:\n"
                    f"Suggested Pros:\n{sugg_pros_str or 'None'}\n"
                    f"Suggested Cons:\n{sugg_cons_str or 'None'}\n\n"
                    "You should provide highly detailed, comprehensive, and well-thought-out explanations when asked. "
                    "Do not artificially limit the length or depth of your chat responses. Respond naturally, thoroughly, "
                    "and analytically, offering deep insights, structural details, and actionable guidance based on their questions."
                )
                
                # Map history to Gemini's contents schema
                contents = []
                for h in history:
                    contents.append({
                        "role": "user" if h.get("role") == "user" else "model",
                        "parts": [{"text": h.get("text", "")}]
                    })
                
                # Append user's new message
                contents.append({
                    "role": "user",
                    "parts": [{"text": message}]
                })
                
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
                
                api_payload = {
                    "contents": contents,
                    "systemInstruction": {
                        "parts": [{"text": system_instruction}]
                    }
                }
                
                req = urllib.request.Request(
                    url,
                    data=json.dumps(api_payload).encode('utf-8'),
                    headers={'Content-Type': 'application/json'},
                    method='POST'
                )
                
                with urllib.request.urlopen(req, timeout=15) as response:
                    res_data = json.loads(response.read().decode('utf-8'))
                    
                text_content = res_data['candidates'][0]['content']['parts'][0]['text']
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"text": text_content}).encode('utf-8'))
                
            except urllib.error.HTTPError as http_err:
                err_body = http_err.read().decode('utf-8')
                print("Gemini API Chat HTTP Error:", http_err.code, err_body)
                self.send_response(http_err.code)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Gemini API returned error: {http_err.reason}"}).encode('utf-8'))
            except Exception as e:
                print("Error handling /api/chat:", e)
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

def run(server_class=HTTPServer, handler_class=DecisionServer):
    try:
        server_address = ('0.0.0.0', PORT)
        httpd = server_class(server_address, handler_class)
        print(f"\n==========================================", flush=True)
        print(f"Decision Server Running on port {PORT}", flush=True)
        print(f"URL: http://localhost:{PORT}/", flush=True)
        print(f"Press Ctrl+C in this window to stop the server.", flush=True)
        print(f"==========================================\n", flush=True)
        httpd.serve_forever()
    except OSError as e:
        print(f"OSError during server startup: {e}", flush=True)
        sys.exit(1)
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print(f"Exception during server startup: {e}", flush=True)
        sys.exit(1)

if __name__ == '__main__':
    run()
