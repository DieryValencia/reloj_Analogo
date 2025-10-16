import json
import time
import datetime
import os

class Node:
    def __init__(self, data):
        self.data = data
        self.next = None
        self.previous = None

class CircularDoublyLinkedList:
    def __init__(self, max_value):
        self.max_value = max_value
        self.head = None
        self.current = None
        self._initialize()

    def _initialize(self):
        if self.max_value <= 0:
            return
        first = Node(0)
        self.head = first
        self.current = first
        current = first
        for i in range(1, self.max_value):
            new_node = Node(i)
            current.next = new_node
            new_node.previous = current
            current = new_node
        current.next = first
        first.previous = current

    def advance(self, steps=1):
        for _ in range(steps):
            self.current = self.current.next

    def retreat(self, steps=1):
        for _ in range(steps):
            self.current = self.current.previous

    def set_value(self, value):
        if 0 <= value < self.max_value:
            self.current = self.head
            self.advance(value)

    def get_value(self):
        return self.current.data

class AnalogClock:
    def __init__(self):
        self.hours = CircularDoublyLinkedList(12)
        self.minutes = CircularDoublyLinkedList(60)
        self.seconds = CircularDoublyLinkedList(60)
        self.alarm_hour = None
        self.alarm_minute = None
        self.alarm_active = False

    def get_current_time(self):
        now = datetime.datetime.now()
        self.hours.set_value(now.hour % 12)
        self.minutes.set_value(now.minute)
        self.seconds.set_value(now.second)

    def sync_with_real_time(self):
        """Sincroniza el reloj con la hora real del sistema"""
        now = datetime.datetime.now()
        self.hours.set_value(now.hour % 12)
        self.minutes.set_value(now.minute)
        self.seconds.set_value(now.second)

    def modify_time(self, hour, minute):
        if 0 <= hour < 12 and 0 <= minute < 60:
            self.hours.set_value(hour)
            self.minutes.set_value(minute)

    def modify_full_time(self, hour, minute, second):
        if 0 <= hour < 12 and 0 <= minute < 60 and 0 <= second < 60:
            self.hours.set_value(hour)
            self.minutes.set_value(minute)
            self.seconds.set_value(second)

    def set_alarm(self, hour, minute):
        if 0 <= hour < 24 and 0 <= minute < 60:
            self.alarm_hour = hour
            self.alarm_minute = minute
            self.alarm_active = True

    def deactivate_alarm(self):
        self.alarm_active = False

    def check_alarm(self):
        if not self.alarm_active:
            return False
        now = datetime.datetime.now()
        return now.hour == self.alarm_hour and now.minute == self.alarm_minute

    def get_angles(self):
        hour = self.hours.get_value()
        minute = self.minutes.get_value()
        second = self.seconds.get_value()

        # Ángulos correctos para reloj analógico (0 grados = 12 en punto)
        # Los ángulos van de 0 a 360 grados en sentido horario
        second_angle = (360 / 60) * second
        minute_angle = (360 / 60) * minute + (360 / 60) * (second / 60)
        hour_angle = (360 / 12) * hour + (360 / 12) * (minute / 60)

        return {
            "hour": hour_angle,
            "minute": minute_angle,
            "second": second_angle,
            "alarm": self.check_alarm()
        }

    def get_current_time_display(self):
        """Devuelve la hora actual en formato legible"""
        now = datetime.datetime.now()
        return {
            "hour": now.hour,
            "minute": now.minute,
            "second": now.second
        }

def main():
    clock = AnalogClock()
    clock.get_current_time()

    # Crear el archivo clock_data.json inicialmente
    angles = clock.get_angles()
    time_display = clock.get_current_time_display()
    data = {
        "hour": angles["hour"],
        "minute": angles["minute"],
        "second": angles["second"],
        "alarm": angles["alarm"],
        "current_hour": time_display["hour"],
        "current_minute": time_display["minute"],
        "current_second": time_display["second"]
    }
    with open('../clock_data.json', 'w') as f:
        json.dump(data, f)
    print("Archivo clock_data.json creado inicialmente")

    print("Reloj analógico iniciado. Las manecillas se moverán cada segundo.")
    print(f"Hora inicial: {time_display['hour']}:{time_display['minute']}:{time_display['second']}")
    print(f"Ángulos iniciales - Hora: {angles['hour']:.1f}°, Minuto: {angles['minute']:.1f}°, Segundo: {angles['second']:.1f}°")
    print("Archivo clock_data.json creado. Presiona Ctrl+C para detener...")

    while True:
        # Verificar si hay una nueva alarma configurada
        try:
            with open('../set_alarm.json', 'r') as f:
                alarm_data = json.load(f)
                clock.set_alarm(alarm_data['hour'], alarm_data['minute'])
                print(f"Alarma configurada para {alarm_data['hour']}:{alarm_data['minute']}")
                # Eliminar el archivo después de leerlo para evitar reconfiguraciones repetidas
                os.remove('../set_alarm.json')
        except FileNotFoundError:
            pass  # No hay nueva alarma

        # Verificar si hay un ajuste de tiempo
        try:
            with open('../set_time.json', 'r') as f:
                time_data = json.load(f)
                # Convertir hora de 24h a 12h para el reloj analógico
                hour_12h = time_data['hour'] % 12
                clock.modify_full_time(hour_12h, time_data['minute'], time_data['second'])
                print(f"Hora ajustada a {time_data['hour']}:{time_data['minute']}:{time_data['second']}")
                # Eliminar el archivo después de leerlo
                os.remove('../set_time.json')
        except FileNotFoundError:
            pass  # No hay ajuste de tiempo

        # Verificar si hay solicitud de sincronización con hora real
        try:
            with open('../sync_time.json', 'r') as f:
                sync_data = json.load(f)
                if sync_data.get('sync'):
                    clock.sync_with_real_time()
                    print("Reloj sincronizado con hora real")
                # Eliminar el archivo después de leerlo
                os.remove('../sync_time.json')
        except FileNotFoundError:
            pass  # No hay solicitud de sincronización

        clock.seconds.advance(1)
        if clock.seconds.get_value() == 0:
            clock.minutes.advance(1)
            if clock.minutes.get_value() == 0:
                clock.hours.advance(1)

        angles = clock.get_angles()
        time_display = clock.get_current_time_display()
        data = {
            "hour": angles["hour"],
            "minute": angles["minute"],
            "second": angles["second"],
            "alarm": angles["alarm"],
            "current_hour": time_display["hour"],
            "current_minute": time_display["minute"],
            "current_second": time_display["second"]
        }
        with open('../clock_data.json', 'w') as f:
            json.dump(data, f)

        time.sleep(1)

if __name__ == "__main__":
    main()