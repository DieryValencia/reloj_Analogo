const canvas = document.getElementById('clock');
const ctx = canvas.getContext('2d');
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = 180;

// Variables para modo local
let customTime = null;
let alarmTime = null;

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

let backendAvailable = false;

function updateClock() {
    // Intentar cargar desde el servidor HTTP primero
    fetch('http://localhost:8000/clock_data.json?' + Date.now()) // Agregar timestamp para evitar cache
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            backendAvailable = true;
            return response.json();
        })
        .then(data => {
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
                console.log(`Backend activo - Tiempo: ${hora}:${minuto}:${segundo} - Ángulos: H:${data.hora.toFixed(1)}° M:${data.minuto.toFixed(1)}° S:${data.segundo.toFixed(1)}°`);
            } else {
                console.warn('Datos del reloj inválidos:', data);
                // Dibujar reloj con valores por defecto en caso de datos inválidos
                drawClock(0, 0, 0, false);
            }
        })
        .catch(error => {
            if (backendAvailable) {
                console.error('Backend dejó de responder:', error);
                backendAvailable = false;
            }
            // Simular movimiento del reloj con JavaScript como último recurso
            console.log('Usando modo simulado - reloj se moverá con JavaScript');
            simulateClock();
        });
}

// Función para establecer la alarma (modo local)
function setAlarm() {
    const hourInput = document.getElementById('alarm-hour');
    const minuteInput = document.getElementById('alarm-minute');
    const hour = parseInt(hourInput.value);
    const minute = parseInt(minuteInput.value);

    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        alert('Por favor ingresa una hora y minuto válidos.');
        return;
    }

    // Guardar alarma en localStorage
    const alarmTime = { hora: hour, minuto: minute };
    localStorage.setItem('alarmTime', JSON.stringify(alarmTime));

    alert(`Alarma establecida para las ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    hourInput.value = '';
    minuteInput.value = '';

    console.log('Alarma guardada localmente:', alarmTime);
}

// Función para ajustar la hora (modo local)
function setTime() {
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

    // Ajustar la hora del reloj simulado
    customTime = { hora: hour, minuto: minute, segundo: second };
    localStorage.setItem('customTime', JSON.stringify(customTime));

    alert(`Hora ajustada a ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`);
    hourInput.value = '';
    minuteInput.value = '';
    secondInput.value = '';

    console.log('Hora personalizada guardada:', customTime);
}

// Función para sincronizar con la hora real (modo local)
function syncTime() {
    // Limpiar hora personalizada para usar la hora real
    localStorage.removeItem('customTime');
    customTime = null;

    alert('Reloj sincronizado con la hora real del sistema.');
    console.log('Sincronización completada - usando hora del sistema');
}

// Agregar event listeners a los botones
document.getElementById('set-alarm-btn').addEventListener('click', setAlarm);
document.getElementById('set-time-btn').addEventListener('click', setTime);
document.getElementById('sync-time-btn').addEventListener('click', syncTime);

// Actualizar el reloj cada segundo
setInterval(() => {
    updateClock();
}, 1000);

// Cargar inicialmente
updateClock();

// Función para simular el movimiento del reloj (modo completamente local)
function simulateClock() {
    const now = new Date();

    // Usar hora personalizada si existe, sino usar hora del sistema
    let hora, minuto, segundo;
    if (customTime) {
        hora = customTime.hora;
        minuto = customTime.minuto;
        segundo = customTime.segundo;
        // Incrementar segundos para simular el paso del tiempo
        segundo++;
        if (segundo >= 60) {
            segundo = 0;
            minuto++;
            if (minuto >= 60) {
                minuto = 0;
                hora = (hora + 1) % 24;
            }
        }
        // Actualizar la hora personalizada
        customTime.segundo = segundo;
        customTime.minuto = minuto;
        customTime.hora = hora;
    } else {
        hora = now.getHours();
        minuto = now.getMinutes();
        segundo = now.getSeconds();
    }

    // Calcular ángulos
    const anguloSegundo = (360 / 60) * segundo;
    const anguloMinuto = (360 / 60) * minuto + (360 / 60) * (segundo / 60);
    const anguloHora = (360 / 12) * (hora % 12) + (360 / 12) * (minuto / 60);

    // Verificar alarma
    let alarmActive = false;
    if (alarmTime && hora === alarmTime.hora && minuto === alarmTime.minuto) {
        alarmActive = true;
        // Mostrar alerta de alarma (solo una vez por minuto)
        if (segundo === 0) {
            alert(`¡ALARMA! Son las ${alarmTime.hora.toString().padStart(2, '0')}:${alarmTime.minuto.toString().padStart(2, '0')}`);
        }
    }

    // Dibujar reloj
    drawClock(anguloHora, anguloMinuto, anguloSegundo, alarmActive);

    // Actualizar display de tiempo
    const period = hora >= 12 ? 'PM' : 'AM';
    const hora12 = hora % 12 || 12;
    const timeString = `${hora12.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}:${segundo.toString().padStart(2, '0')} ${period}`;
    document.getElementById('time-display').textContent = timeString;

    const modeText = customTime ? 'personalizada' : 'sistema';
    console.log(`Modo local (${modeText}) - Tiempo: ${hora}:${minuto}:${segundo} - Ángulos: H:${anguloHora.toFixed(1)}° M:${anguloMinuto.toFixed(1)}° S:${anguloSegundo.toFixed(1)}°`);
}

// Cargar configuraciones guardadas al iniciar
function loadSavedSettings() {
    const savedAlarm = localStorage.getItem('alarmTime');
    if (savedAlarm) {
        alarmTime = JSON.parse(savedAlarm);
        console.log('Alarma cargada:', alarmTime);
    }

    const savedTime = localStorage.getItem('customTime');
    if (savedTime) {
        customTime = JSON.parse(savedTime);
        console.log('Hora personalizada cargada:', customTime);
    }
}

// Debug: mostrar que el script se cargó
console.log('Reloj analógico cargado completamente en modo local.');

// Cargar configuraciones al iniciar
loadSavedSettings();