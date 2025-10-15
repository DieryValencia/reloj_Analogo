const canvas = document.getElementById('clock');
const ctx = canvas.getContext('2d');
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = 180;

// Variables para modo local
let customTime = null;
let alarmTime = null;
let alarmsList = [];
let audioContext = null;
let isAlarmPlaying = false;

function drawClock(hourAngle, minuteAngle, secondAngle, alarm) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar círculo del reloj con gradiente
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, '#00ff00');
    gradient.addColorStop(0.7, '#00aa00');
    gradient.addColorStop(1, '#004400');

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset shadow

    // Dibujar números con efecto neon verde pulsante
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#00ff00';
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 8;
    for (let i = 1; i <= 12; i++) {
        const angle = (i * 30 - 90) * Math.PI / 180;
        const x = centerX + Math.cos(angle) * (radius - 30);
        const y = centerY + Math.sin(angle) * (radius - 30);
        // Efecto de brillo variable
        const brightness = 0.8 + 0.2 * Math.sin(Date.now() * 0.005 + i);
        ctx.globalAlpha = brightness;
        ctx.fillText(i.toString(), x, y);
        ctx.globalAlpha = 1;
    }
    ctx.shadowBlur = 0; // Reset shadow

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
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 3;
        ctx.stroke();
    }
    ctx.shadowBlur = 0; // Reset shadow

    // Dibujar manecillas
    drawHand(hourAngle, radius * 0.5, 8, '#00ff00');
    drawHand(minuteAngle, radius * 0.7, 6, '#00ff00');
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

    // Crear gradiente para la manecilla
    const handGradient = ctx.createLinearGradient(centerX, centerY, x, y);
    handGradient.addColorStop(0, color);
    handGradient.addColorStop(0.5, '#ffffff');
    handGradient.addColorStop(1, color);

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = handGradient;
    ctx.lineWidth = width;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset shadow
}

let backendAvailable = false;

function updateClock() {
    // Modo completamente local - no intentar conectar con servidor
    simulateClock();
}

// Función para actualizar la lista de alarmas en la UI
function updateAlarmsList() {
    const alarmsListElement = document.getElementById('alarms-list');
    alarmsListElement.innerHTML = '';

    alarmsList.forEach((alarm, index) => {
        const li = document.createElement('li');
        const timeString = `${alarm.hora.toString().padStart(2, '0')}:${alarm.minuto.toString().padStart(2, '0')}`;
        li.innerHTML = `
            <span>Alarma: ${timeString}</span>
            <button onclick="deleteAlarm(${index})">Eliminar</button>
        `;
        alarmsListElement.appendChild(li);
    });
}

// Función para eliminar una alarma
function deleteAlarm(index) {
    if (confirm('¿Estás seguro de que quieres eliminar esta alarma?')) {
        alarmsList.splice(index, 1);
        localStorage.setItem('alarmsList', JSON.stringify(alarmsList));

        // Si eliminamos la alarma activa, desactivarla
        if (alarmTime && alarmsList.length === 0) {
            alarmTime = null;
            localStorage.removeItem('alarmTime');
        } else if (alarmsList.length > 0) {
            // Establecer la primera alarma como activa
            alarmTime = alarmsList[0];
            localStorage.setItem('alarmTime', JSON.stringify(alarmTime));
        }

        updateAlarmsList();
        console.log('Alarma eliminada');
    }
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

    // Agregar alarma a la lista
    const newAlarm = { hora: hour, minuto: minute };
    alarmsList.push(newAlarm);

    // Guardar lista completa en localStorage
    localStorage.setItem('alarmsList', JSON.stringify(alarmsList));

    // Establecer como alarma activa (la primera o la más próxima)
    if (!alarmTime) {
        alarmTime = newAlarm;
        localStorage.setItem('alarmTime', JSON.stringify(alarmTime));
    }

    alert(`Alarma establecida para las ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    hourInput.value = '';
    minuteInput.value = '';

    updateAlarmsList();
    console.log('Alarma agregada:', newAlarm);
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

    // Verificar alarmas
    let alarmActive = false;
    alarmsList.forEach(alarm => {
        if (hora === alarm.hora && minuto === alarm.minuto) {
            alarmActive = true;
            // Mostrar alerta de alarma (solo una vez por minuto)
            if (segundo === 0) {
                playAlarmSound();
                // Pequeño delay para que el sonido empiece antes de la alerta
                setTimeout(() => {
                    alert(`¡ALARMA! Son las ${alarm.hora.toString().padStart(2, '0')}:${alarm.minuto.toString().padStart(2, '0')}`);
                }, 100);
            }
        }
    });

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

// Función para reproducir sonido de alarma
function playAlarmSound() {
    if (isAlarmPlaying) return; // Evitar múltiples sonidos simultáneos

    try {
        // Crear contexto de audio si no existe
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Reanudar contexto si está suspendido (requerido por algunos navegadores)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        isAlarmPlaying = true;

        // Crear oscilador para el sonido
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        // Conectar nodos
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Configurar sonido de alarma (patrón alternante)
        const currentTime = audioContext.currentTime;

        // Patrón de beep-beep-beep-pausa
        for (let i = 0; i < 3; i++) {
            const startTime = currentTime + i * 0.3;
            const endTime = startTime + 0.2;

            oscillator.frequency.setValueAtTime(1000, startTime); // Frecuencia alta
            oscillator.frequency.setValueAtTime(800, startTime + 0.1); // Bajar frecuencia

            gainNode.gain.setValueAtTime(0.3, startTime);
            gainNode.gain.setValueAtTime(0, endTime);
        }

        oscillator.type = 'square'; // Tipo de onda

        // Reproducir
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 1.2); // Duración total

        // Resetear flag después de que termine el sonido
        setTimeout(() => {
            isAlarmPlaying = false;
        }, 1200);

        console.log('Sonido de alarma reproducido');

    } catch (error) {
        console.error('Error reproduciendo sonido de alarma:', error);
        isAlarmPlaying = false;
    }
}

// Cargar configuraciones guardadas al iniciar
function loadSavedSettings() {
    const savedAlarms = localStorage.getItem('alarmsList');
    if (savedAlarms) {
        alarmsList = JSON.parse(savedAlarms);
        // Establecer la primera alarma como activa
        if (alarmsList.length > 0) {
            alarmTime = alarmsList[0];
        }
        console.log('Alarmas cargadas:', alarmsList);
    }

    const savedTime = localStorage.getItem('customTime');
    if (savedTime) {
        customTime = JSON.parse(savedTime);
        console.log('Hora personalizada cargada:', customTime);
    }

    updateAlarmsList();
}

// Inicializar audio context al primer clic del usuario
document.addEventListener('click', function initAudioOnFirstClick() {
    initAudioContext();
    document.removeEventListener('click', initAudioOnFirstClick);
    console.log('Audio inicializado con interacción del usuario');
});

// Debug: mostrar que el script se cargó
console.log('Reloj analógico cargado completamente en modo local.');

// Cargar configuraciones al iniciar
loadSavedSettings();