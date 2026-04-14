#!/usr/bin/env python3
"""
Python Client for Darija Translator REST Service.

Supports a Tkinter GUI (default) and a CLI one-shot mode.

Usage:
  python client.py                        # launch GUI
  python client.py --cli "Hello"          # CLI one-shot
  python client.py --cli "Hello" --lang French
  python client.py --cli "Hello" --server http://192.168.1.100:8080/darija-translator/api/translator
"""

import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request

# Configuration — override via environment variables in production
API_BASE = os.environ.get("DARIJA_API_BASE", "http://localhost:8080/darija-translator/api/translator")
USERNAME = os.environ.get("DARIJA_API_USER", "translator-user")
PASSWORD = os.environ.get("DARIJA_API_PASS", "")


def _auth_header() -> str:
    credentials = base64.b64encode(f"{USERNAME}:{PASSWORD}".encode()).decode()
    return f"Basic {credentials}"


def health_check() -> bool:
    try:
        req = urllib.request.Request(f"{API_BASE}/health")
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status == 200
    except Exception:
        return False


def translate(text: str, source_lang: str = "English") -> dict:
    """Call POST /translate and return the parsed JSON response."""
    payload = json.dumps({"text": text, "sourceLanguage": source_lang}).encode()
    req = urllib.request.Request(
        url=f"{API_BASE}/translate",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": _auth_header(),
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if e.code == 401:
            return {"success": False, "errorMessage": "Authentication failed (401). Check credentials."}
        return {"success": False, "errorMessage": f"HTTP {e.code}: {body}"}
    except Exception as exc:
        return {"success": False, "errorMessage": str(exc)}


def run_cli(text: str, lang: str) -> None:
    print("=== Darija Translator (Python CLI) ===")
    print(f"Service UP: {health_check()}\n")
    print(f"Source [{lang}]: {text}")
    result = translate(text, lang)
    if result.get("success"):
        print(f"Darija   : {result['translatedText']}")
    else:
        print(f"Error    : {result.get('errorMessage', 'Unknown error')}")


def run_gui() -> None:
    try:
        import tkinter as tk
        from tkinter import ttk, messagebox
    except ImportError:
        print("Tkinter not available. Use --cli mode.")
        sys.exit(1)

    root = tk.Tk()
    root.title("🇲🇦 Darija Translator")
    root.geometry("560x620")
    root.configure(bg="#f4f6f8")
    root.resizable(True, True)

    style = ttk.Style()
    style.theme_use("clam")
    style.configure("TLabel",  background="#f4f6f8", font=("Segoe UI", 10))
    style.configure("TButton", font=("Segoe UI", 10, "bold"))
    style.configure("Accent.TButton", foreground="white", background="#c1272d")

    header = tk.Frame(root, bg="#c1272d", pady=12)
    header.pack(fill="x")
    tk.Label(header, text="🇲🇦  Darija Translator", bg="#c1272d",
             fg="white", font=("Segoe UI", 15, "bold")).pack()
    tk.Label(header, text="Powered by Google Gemini AI", bg="#c1272d",
             fg="#ffcccc", font=("Segoe UI", 9)).pack()

    status_var = tk.StringVar(value="Checking service…")
    status_lbl = tk.Label(root, textvariable=status_var, bg="#f4f6f8",
                          font=("Segoe UI", 9, "italic"), fg="#888")
    status_lbl.pack(pady=(6, 0))

    def refresh_status():
        up = health_check()
        status_var.set("● Service UP" if up else "● Service DOWN — start the server")
        status_lbl.config(fg="#155724" if up else "#721c24")

    root.after(100, refresh_status)

    frm_lang = tk.Frame(root, bg="#f4f6f8")
    frm_lang.pack(padx=16, pady=(10, 0), fill="x")
    tk.Label(frm_lang, text="Source Language:", bg="#f4f6f8").pack(side="left")
    lang_var = tk.StringVar(value="English")
    lang_menu = ttk.Combobox(frm_lang, textvariable=lang_var, width=14,
                              values=["English", "French", "Spanish", "Arabic", "German"],
                              state="readonly")
    lang_menu.pack(side="left", padx=8)
    tk.Label(frm_lang, text="→  دارجة", bg="#f4f6f8", font=("Segoe UI", 11)).pack(side="left")

    frm_src = tk.LabelFrame(root, text=" Source Text ", bg="#f4f6f8",
                             font=("Segoe UI", 9, "bold"), padx=8, pady=8)
    frm_src.pack(padx=16, pady=10, fill="both")
    src_text = tk.Text(frm_src, height=6, font=("Segoe UI", 10),
                       wrap="word", bd=1, relief="solid")
    src_text.pack(fill="both", expand=True)

    frm_btn = tk.Frame(root, bg="#f4f6f8")
    frm_btn.pack(padx=16, fill="x")

    result_var = tk.StringVar()
    loading_var = tk.StringVar()

    def do_translate():
        text = src_text.get("1.0", "end").strip()
        if not text:
            messagebox.showwarning("Empty", "Please enter text to translate.")
            return
        loading_var.set("Translating…")
        btn_translate.config(state="disabled")
        root.update()

        result = translate(text, lang_var.get())

        loading_var.set("")
        btn_translate.config(state="normal")

        if result.get("success"):
            result_var.set(result["translatedText"])
            out_text.config(state="normal")
            out_text.delete("1.0", "end")
            out_text.insert("end", result["translatedText"])
            out_text.config(state="disabled")
        else:
            messagebox.showerror("Error", result.get("errorMessage", "Unknown error"))

    def do_clear():
        src_text.delete("1.0", "end")
        out_text.config(state="normal")
        out_text.delete("1.0", "end")
        out_text.config(state="disabled")
        result_var.set("")

    def do_copy():
        val = result_var.get()
        if val:
            root.clipboard_clear()
            root.clipboard_append(val)
            messagebox.showinfo("Copied", "Translation copied to clipboard!")

    btn_translate = ttk.Button(frm_btn, text="Translate ترجم", command=do_translate)
    btn_translate.pack(side="left", pady=6, ipadx=10)
    ttk.Button(frm_btn, text="Clear ✕", command=do_clear).pack(side="left", padx=8)
    ttk.Button(frm_btn, text="Copy نسخ", command=do_copy).pack(side="left")
    tk.Label(frm_btn, textvariable=loading_var, bg="#f4f6f8",
             fg="#c1272d", font=("Segoe UI", 9, "italic")).pack(side="left", padx=12)

    frm_out = tk.LabelFrame(root, text=" 🇲🇦 Darija Translation ", bg="#f4f6f8",
                             font=("Segoe UI", 9, "bold"), padx=8, pady=8)
    frm_out.pack(padx=16, pady=8, fill="both", expand=True)
    out_text = tk.Text(frm_out, height=7, font=("Traditional Arabic", 13),
                       wrap="word", bd=1, relief="solid", state="disabled",
                       bg="#fafafa")
    out_text.pack(fill="both", expand=True)

    root.bind("<Control-Return>", lambda e: do_translate())

    root.mainloop()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Darija Translator Python Client")
    parser.add_argument("--cli",  metavar="TEXT", help="Translate TEXT in CLI mode")
    parser.add_argument("--lang", default="English", help="Source language (default: English)")
    parser.add_argument("--server", default=None, help="Override API base URL")
    args = parser.parse_args()

    if args.server:
        API_BASE = args.server.rstrip("/") + "/api/translator"

    if args.cli:
        run_cli(args.cli, args.lang)
    else:
        run_gui()
