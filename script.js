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
        const data = await response.json();

        drawClock(data.hora, data.minuto, data.segundo, data.alarma);

        // Actualizar display de tiempo usando los datos del backend
        const hora = data.hora_actual || 0;
        const minuto = data.minuto_actual || 0;
        const segundo = data.segundo_actual || 0;

        const timeString = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}:${segundo.toString().padStart(2, '0')}`;
        document.getElementById('time-display').textContent = timeString;
    } catch (error) {
        console.error('Error al cargar datos del reloj:', error);
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

// Agregar event listener al botón
document.getElementById('set-alarm-btn').addEventListener('click', setAlarm);

// Actualizar el reloj cada segundo
setInterval(updateClock, 1000);

// Cargar inicialmente
updateClock();