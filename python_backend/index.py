import json
import time
import datetime
import os

class Nodo:
    def __init__(self, dato):
        self.dato = dato
        self.siguiente = None
        self.anterior = None

class ListaCircularDoble:
    def __init__(self, max_valor):
        self.max_valor = max_valor
        self.cabeza = None
        self.actual = None
        self._inicializar()

    def _inicializar(self):
        if self.max_valor <= 0:
            return
        primero = Nodo(0)
        self.cabeza = primero
        self.actual = primero
        actual = primero
        for i in range(1, self.max_valor):
            nuevo = Nodo(i)
            actual.siguiente = nuevo
            nuevo.anterior = actual
            actual = nuevo
        actual.siguiente = primero
        primero.anterior = actual

    def avanzar(self, pasos=1):
        for _ in range(pasos):
            self.actual = self.actual.siguiente

    def retroceder(self, pasos=1):
        for _ in range(pasos):
            self.actual = self.actual.anterior

    def set_valor(self, valor):
        if 0 <= valor < self.max_valor:
            self.actual = self.cabeza
            self.avanzar(valor)

    def get_valor(self):
        return self.actual.dato

class RelojAnalogico:
    def __init__(self):
        self.horas = ListaCircularDoble(12)
        self.minutos = ListaCircularDoble(60)
        self.segundos = ListaCircularDoble(60)
        self.alarma_hora = None
        self.alarma_minuto = None
        self.alarma_activa = False

    def obtener_hora_actual(self):
        ahora = datetime.datetime.now()
        self.horas.set_valor(ahora.hour % 12)
        self.minutos.set_valor(ahora.minute)
        self.segundos.set_valor(ahora.second)

    def sincronizar_con_hora_real(self):
        """Sincroniza el reloj con la hora real del sistema"""
        ahora = datetime.datetime.now()
        self.horas.set_valor(ahora.hour % 12)
        self.minutos.set_valor(ahora.minute)
        self.segundos.set_valor(ahora.second)

    def modificar_hora(self, hora, minuto):
        if 0 <= hora < 12 and 0 <= minuto < 60:
            self.horas.set_valor(hora)
            self.minutos.set_valor(minuto)

    def modificar_tiempo_completo(self, hora, minuto, segundo):
        if 0 <= hora < 12 and 0 <= minuto < 60 and 0 <= segundo < 60:
            self.horas.set_valor(hora)
            self.minutos.set_valor(minuto)
            self.segundos.set_valor(segundo)

    def set_alarma(self, hora, minuto):
        if 0 <= hora < 24 and 0 <= minuto < 60:
            self.alarma_hora = hora
            self.alarma_minuto = minuto
            self.alarma_activa = True

    def desactivar_alarma(self):
        self.alarma_activa = False

    def verificar_alarma(self):
        if not self.alarma_activa:
            return False
        ahora = datetime.datetime.now()
        return ahora.hour == self.alarma_hora and ahora.minute == self.alarma_minuto

    def get_angulos(self):
        hora = self.horas.get_valor()
        minuto = self.minutos.get_valor()
        segundo = self.segundos.get_valor()

        # Ángulos correctos para reloj analógico (0 grados = 12 en punto)
        # Los ángulos van de 0 a 360 grados en sentido horario
        angulo_segundo = (360 / 60) * segundo
        angulo_minuto = (360 / 60) * minuto + (360 / 60) * (segundo / 60)
        angulo_hora = (360 / 12) * hora + (360 / 12) * (minuto / 60)

        return {
            "hora": angulo_hora,
            "minuto": angulo_minuto,
            "segundo": angulo_segundo,
            "alarma": self.verificar_alarma()
        }

    def get_tiempo_actual(self):
        """Devuelve la hora actual en formato legible"""
        ahora = datetime.datetime.now()
        return {
            "hora": ahora.hour,
            "minuto": ahora.minute,
            "segundo": ahora.second
        }

def main():
    reloj = RelojAnalogico()
    reloj.obtener_hora_actual()

    # Crear el archivo clock_data.json inicialmente
    angulos = reloj.get_angulos()
    tiempo = reloj.get_tiempo_actual()
    data = {
        "hora": angulos["hora"],
        "minuto": angulos["minuto"],
        "segundo": angulos["segundo"],
        "alarma": angulos["alarma"],
        "hora_actual": tiempo["hora"],
        "minuto_actual": tiempo["minuto"],
        "segundo_actual": tiempo["segundo"]
    }
    with open('../clock_data.json', 'w') as f:
        json.dump(data, f)
    print("Archivo clock_data.json creado inicialmente")

    print("Reloj analógico iniciado. Las manecillas se moverán cada segundo.")
    print(f"Hora inicial: {tiempo['hora']}:{tiempo['minuto']}:{tiempo['segundo']}")
    print(f"Ángulos iniciales - Hora: {angulos['hora']:.1f}°, Minuto: {angulos['minuto']:.1f}°, Segundo: {angulos['segundo']:.1f}°")
    print("Archivo clock_data.json creado. Presiona Ctrl+C para detener...")

    while True:
        # Verificar si hay una nueva alarma configurada
        try:
            with open('../set_alarm.json', 'r') as f:
                alarm_data = json.load(f)
                reloj.set_alarma(alarm_data['hora'], alarm_data['minuto'])
                print(f"Alarma configurada para {alarm_data['hora']}:{alarm_data['minuto']}")
                # Eliminar el archivo después de leerlo para evitar reconfiguraciones repetidas
                os.remove('../set_alarm.json')
        except FileNotFoundError:
            pass  # No hay nueva alarma

        # Verificar si hay un ajuste de tiempo
        try:
            with open('../set_time.json', 'r') as f:
                time_data = json.load(f)
                # Convertir hora de 24h a 12h para el reloj analógico
                hora_12h = time_data['hora'] % 12
                reloj.modificar_tiempo_completo(hora_12h, time_data['minuto'], time_data['segundo'])
                print(f"Hora ajustada a {time_data['hora']}:{time_data['minuto']}:{time_data['segundo']}")
                # Eliminar el archivo después de leerlo
                os.remove('../set_time.json')
        except FileNotFoundError:
            pass  # No hay ajuste de tiempo

        # Verificar si hay solicitud de sincronización con hora real
        try:
            with open('../sync_time.json', 'r') as f:
                sync_data = json.load(f)
                if sync_data.get('sync'):
                    reloj.sincronizar_con_hora_real()
                    print("Reloj sincronizado con hora real")
                # Eliminar el archivo después de leerlo
                os.remove('../sync_time.json')
        except FileNotFoundError:
            pass  # No hay solicitud de sincronización

        reloj.segundos.avanzar(1)
        if reloj.segundos.get_valor() == 0:
            reloj.minutos.avanzar(1)
            if reloj.minutos.get_valor() == 0:
                reloj.horas.avanzar(1)

        angulos = reloj.get_angulos()
        tiempo = reloj.get_tiempo_actual()
        data = {
            "hora": angulos["hora"],
            "minuto": angulos["minuto"],
            "segundo": angulos["segundo"],
            "alarma": angulos["alarma"],
            "hora_actual": tiempo["hora"],
            "minuto_actual": tiempo["minuto"],
            "segundo_actual": tiempo["segundo"]
        }
        with open('../clock_data.json', 'w') as f:
            json.dump(data, f)

        time.sleep(1)

if __name__ == "__main__":
    main()