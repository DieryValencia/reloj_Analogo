import subprocess
import os
import sys
import http.server
import socketserver
import threading
import json

def start_python_backend():
    """Inicia el backend de Python en background"""
    python_path = os.path.join(os.getcwd(), 'python_backend', 'index.py')
    return subprocess.Popen([sys.executable, python_path])

def start_http_server():
    """Inicia un servidor HTTP simple para servir los archivos estáticos"""
    PORT = 8000

    class CustomHandler(http.server.SimpleHTTPRequestHandler):
        def end_headers(self):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            super().end_headers()

        def do_GET(self):
            if self.path == '/clock_data.json':
                try:
                    with open('clock_data.json', 'r') as f:
                        content = f.read()
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(content.encode('utf-8'))
                except FileNotFoundError:
                    # JSON por defecto si el archivo no existe
                    default_data = {
                        "hora": 0,
                        "minuto": 0,
                        "segundo": 0,
                        "alarma": False,
                        "hora_actual": 0,
                        "minuto_actual": 0,
                        "segundo_actual": 0
                    }
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(default_data).encode('utf-8'))
            else:
                # Para otros archivos, usar el comportamiento por defecto
                super().do_GET()

        def do_POST(self):
            if self.path == '/set_alarm':
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                try:
                    alarm_data = json.loads(post_data.decode('utf-8'))
                    hora = alarm_data.get('hora')
                    minuto = alarm_data.get('minuto')
                    if isinstance(hora, int) and isinstance(minuto, int) and 0 <= hora < 24 and 0 <= minuto < 60:
                        with open('set_alarm.json', 'w') as f:
                            json.dump({'hora': hora, 'minuto': minuto}, f)
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({'status': 'success'}).encode('utf-8'))
                    else:
                        self.send_response(400)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({'status': 'error', 'message': 'Invalid hour or minute'}).encode('utf-8'))
                except json.JSONDecodeError:
                    self.send_response(400)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'status': 'error', 'message': 'Invalid JSON'}).encode('utf-8'))
            elif self.path == '/set_time':
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                try:
                    time_data = json.loads(post_data.decode('utf-8'))
                    hora = time_data.get('hora')
                    minuto = time_data.get('minuto')
                    segundo = time_data.get('segundo')
                    if (isinstance(hora, int) and isinstance(minuto, int) and isinstance(segundo, int) and
                        0 <= hora < 24 and 0 <= minuto < 60 and 0 <= segundo < 60):
                        with open('set_time.json', 'w') as f:
                            json.dump({'hora': hora, 'minuto': minuto, 'segundo': segundo}, f)
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({'status': 'success'}).encode('utf-8'))
                    else:
                        self.send_response(400)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({'status': 'error', 'message': 'Invalid time values'}).encode('utf-8'))
                except json.JSONDecodeError:
                    self.send_response(400)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'status': 'error', 'message': 'Invalid JSON'}).encode('utf-8'))
            elif self.path == '/sync_time':
                # Crear archivo para sincronizar con hora real
                with open('sync_time.json', 'w') as f:
                    json.dump({'sync': True}, f)
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'success'}).encode('utf-8'))
            else:
                self.send_response(404)
                self.end_headers()

    try:
        with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
            print(f"Servidor HTTP iniciado en http://localhost:{PORT}")
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 10048:  # Address already in use
            print(f"El puerto {PORT} ya está en uso. Intenta cerrar otras instancias del servidor.")
        else:
            print(f"Error al iniciar el servidor: {e}")
        return

if __name__ == "__main__":
    print("Iniciando reloj analógico...")
    print("Iniciando backend de Python...")

    # Iniciar backend en background
    backend_process = start_python_backend()

    print("Backend iniciado. Iniciando servidor HTTP...")
    print("Presiona Ctrl+C para detener.")

    try:
        # Iniciar servidor HTTP en un hilo separado
        server_thread = threading.Thread(target=start_http_server)
        server_thread.daemon = True
        server_thread.start()

        # Mantener el programa corriendo
        while server_thread.is_alive():
            server_thread.join(timeout=1)
    except KeyboardInterrupt:
        print("\nDeteniendo servicios...")
        backend_process.terminate()
        backend_process.wait()
        print("Servicios detenidos.")