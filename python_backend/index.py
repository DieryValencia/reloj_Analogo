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

    def modificar_hora(self, hora, minuto):
        if 0 <= hora < 12 and 0 <= minuto < 60:
            self.horas.set_valor(hora)
            self.minutos.set_valor(minuto)

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

        # Ángulos: 360 grados / max_valor * valor
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
        json.dump(data, f, indent=2)

    while True:
        # Verificar si hay una nueva alarma configurada
        try:
            with open('../set_alarm.json', 'r') as f:
                alarm_data = json.load(f)
                reloj.set_alarma(alarm_data['hora'], alarm_data['minuto'])
                # Eliminar el archivo después de leerlo para evitar reconfiguraciones repetidas
                os.remove('../set_alarm.json')
        except FileNotFoundError:
            pass  # No hay nueva alarma

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
            json.dump(data, f, indent=2)

        time.sleep(1)

if __name__ == "__main__":
    main()