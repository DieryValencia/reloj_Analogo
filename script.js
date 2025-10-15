const canvas = document.getElementById('clock');
const ctx = canvas.getContext('2d');
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = 180;

function drawClock(hourAngle, minuteAngle, secondAngle, alarm) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar círculo del reloj
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Dibujar números
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) {
        const angle = (i * 30 - 90) * Math.PI / 180;
        const x = centerX + Math.cos(angle) * (radius - 30);
        const y = centerY + Math.sin(angle) * (radius - 30);
        ctx.fillText(i.toString(), x, y);
    }

    // Dibujar marcas de minutos
    for (let i = 0; i < 60; i++) {
        const angle = (i * 6 - 90) * Math.PI / 180;
        const innerRadius = radius - 10;
        const outerRadius = radius - 5;
        const x1 = centerX + Math.cos(angle) * innerRadius;
        const y1 = centerY + Math.sin(angle) * innerRadius;
        const x2 = centerX + Math.cos(angle) * outerRadius;
        const y2 = centerY + Math.sin(angle) * outerRadius;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Dibujar manecillas
    drawHand(hourAngle, radius * 0.5, 8, '#333');
    drawHand(minuteAngle, radius * 0.7, 6, '#333');
    drawHand(secondAngle, radius * 0.9, 2, '#ff0000');

    // Mostrar alarma si está activa
    const alarmElement = document.getElementById('alarm-message');
    if (alarm) {
        alarmElement.style.display = 'block';
    } else {
        alarmElement.style.display = 'none';
    }
}

function drawHand(angle, length, width, color) {
    // Convertir ángulo a radianes (0 grados = 12 en punto, sentido horario)
    // Restar 90 grados para alinear con el sistema de coordenadas del canvas
    const radian = (angle - 90) * Math.PI / 180;
    const x = centerX + Math.cos(radian) * length;
    const y = centerY + Math.sin(radian) * length;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
}

async function updateClock() {
    try {
        const response = await fetch('clock_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Verificar que los datos sean válidos
        if (data && typeof data.hora === 'number' && typeof data.minuto === 'number' && typeof data.segundo === 'number') {
            // Dibujar el reloj con los ángulos calculados
            drawClock(data.hora, data.minuto, data.segundo, data.alarma);

            // Actualizar display de tiempo usando los datos del backend
            const hora = data.hora_actual || 0;
            const minuto = data.minuto_actual || 0;
            const segundo = data.segundo_actual || 0;

            // Formato 12 horas con AM/PM
            const period = hora >= 12 ? 'PM' : 'AM';
            const hora12 = hora % 12 || 12; // Convertir 0 a 12 para formato 12h
            const timeString = `${hora12.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}:${segundo.toString().padStart(2, '0')} ${period}`;
            document.getElementById('time-display').textContent = timeString;

            // Debug: mostrar ángulos en consola
            console.log(`Ángulos - Hora: ${data.hora.toFixed(1)}°, Minuto: ${data.minuto.toFixed(1)}°, Segundo: ${data.segundo.toFixed(1)}°`);
        } else {
            console.warn('Datos del reloj inválidos:', data);
            // Dibujar reloj con valores por defecto en caso de datos inválidos
            drawClock(0, 0, 0, false);
        }
    } catch (error) {
        console.error('Error al cargar datos del reloj:', error);
        // Dibujar reloj con valores por defecto en caso de error
        drawClock(0, 0, 0, false);
        document.getElementById('time-display').textContent = '00:00:00 AM';
    }
}

// Función para establecer la alarma
async function setAlarm() {
    const hourInput = document.getElementById('alarm-hour');
    const minuteInput = document.getElementById('alarm-minute');
    const hour = parseInt(hourInput.value);
    const minute = parseInt(minuteInput.value);

    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        alert('Por favor ingresa una hora y minuto válidos.');
        return;
    }

    try {
        const response = await fetch('/set_alarm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ hora: hour, minuto: minute })
        });

        const result = await response.json();
        if (result.status === 'success') {
            alert('Alarma establecida correctamente.');
            hourInput.value = '';
            minuteInput.value = '';
        } else {
            alert('Error al establecer la alarma: ' + result.message);
        }
    } catch (error) {
        console.error('Error al enviar la solicitud:', error);
        alert('Error al conectar con el servidor.');
    }
}

// Función para ajustar la hora
async function setTime() {
    const hourInput = document.getElementById('set-hour');
    const minuteInput = document.getElementById('set-minute');
    const secondInput = document.getElementById('set-second');
    const hour = parseInt(hourInput.value);
    const minute = parseInt(minuteInput.value);
    const second = parseInt(secondInput.value);

    if (isNaN(hour) || isNaN(minute) || isNaN(second) ||
        hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
        alert('Por favor ingresa valores válidos para hora, minuto y segundo.');
        return;
    }

    try {
        const response = await fetch('/set_time', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ hora: hour, minuto: minute, segundo: second })
        });

        const result = await response.json();
        if (result.status === 'success') {
            alert('Hora ajustada correctamente.');
            hourInput.value = '';
            minuteInput.value = '';
            secondInput.value = '';
        } else {
            alert('Error al ajustar la hora: ' + result.message);
        }
    } catch (error) {
        console.error('Error al enviar la solicitud:', error);
        alert('Error al conectar con el servidor.');
    }
}

// Función para sincronizar con la hora real
async function syncTime() {
    try {
        const response = await fetch('/sync_time', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sync: true })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.status === 'success') {
            alert('Reloj sincronizado con la hora real.');
        } else {
            alert('Error al sincronizar el reloj: ' + result.message);
        }
    } catch (error) {
        console.error('Error al enviar la solicitud:', error);
        alert('Error al conectar con el servidor.');
    }
}

// Agregar event listeners a los botones
document.getElementById('set-alarm-btn').addEventListener('click', setAlarm);
document.getElementById('set-time-btn').addEventListener('click', setTime);
document.getElementById('sync-time-btn').addEventListener('click', syncTime);

// Actualizar el reloj cada segundo
setInterval(updateClock, 1000);

// Cargar inicialmente
updateClock();