(function () {
    const form = document.getElementById('calcForm');
    const mtowEl = document.getElementById('mtow');
    const batteryWhEl = document.getElementById('batteryWh');
    const batteryMassEl = document.getElementById('batteryMass');
    const speedEl = document.getElementById('speed');
    const powerEl = document.getElementById('power');
    const structureMassEl = document.getElementById('structureMass');
    const exportBtn = document.getElementById('exportBtn');

    // Progress bars elements
    const powerBar = document.getElementById('powerBar');
    const batteryBar = document.getElementById('batteryBar');
    const massBar = document.getElementById('massBar');
    const powerValue = document.getElementById('powerValue');
    const batteryValue = document.getElementById('batteryValue');
    const massValue = document.getElementById('massValue');

    function numeric(x) { return Number(x) || 0 }

    function calculateUAVParameters(rangeKm, enduranceMin, payloadKg) {
    // 1. Исходные требования
    const enduranceHours = enduranceMin / 60;
    
    // 2. Расчёт крейсерской скорости из требуемой дальности и времени
    const speedMs = (rangeKm * 1000) / (enduranceHours * 3600);
    
    // 3. Константы и коэффициенты
    const AIR_DENSITY = 1.225; // кг/м³
    const GRAVITY = 9.81; // м/с²
    const BATTERY_ENERGY_DENSITY = 250; // Wh/kg
    const MOTOR_EFFICIENCY = 0.85; // КПД двигателя
    const PROP_EFFICIENCY = 0.75; // КПД винта
    const TOTAL_PROP_EFFICIENCY = MOTOR_EFFICIENCY * PROP_EFFICIENCY;
    
    // Аэродинамические параметры
    const WING_ASPECT_RATIO = 8;
    const WING_EFFICIENCY_FACTOR = 0.85;
    const CRUISE_CL = 0.5;
    const CD0 = 0.03;
    
    // 4. Оценка взлётной массы методом итераций
    let mtow = payloadKg * 4; // Начальная оценка
    
    for (let iteration = 0; iteration < 5; iteration++) {
        // Вес аппарата
        const weight = mtow * GRAVITY;
        
        // Площадь крыла
        const wingArea = (2 * weight) / (AIR_DENSITY * speedMs * speedMs * CRUISE_CL);
        
        // Размах крыла
        const wingspan = Math.sqrt(WING_ASPECT_RATIO * wingArea);
        
        // Индуктивное сопротивление
        const inducedDragCoeff = (CRUISE_CL * CRUISE_CL) / 
            (Math.PI * WING_ASPECT_RATIO * WING_EFFICIENCY_FACTOR);
        
        // Полный коэффициент сопротивления
        const totalCD = CD0 + inducedDragCoeff;
        
        // Аэродинамическое качество
        const liftToDragRatio = CRUISE_CL / totalCD;
        
        // Сила лобового сопротивления
        const dragForce = totalCD * 0.5 * AIR_DENSITY * speedMs * speedMs * wingArea;
        
        // Требуемая механическая мощность на винт
        const propPower = (dragForce * speedMs) / PROP_EFFICIENCY;
        
        // Электрическая мощность от батареи
        const electricPower = propPower / MOTOR_EFFICIENCY;
        
        // Ёмкость батареи (с учётом 80% используемой ёмкости)
        const batteryWh = (electricPower * enduranceHours) / 0.8;
        
        // Масса батареи
        const batteryMass = batteryWh / BATTERY_ENERGY_DENSITY;
        
        // Нагрузка на крыло
        const wingLoading = weight / wingArea;
        
        // Масса конструкции
        const structureMass = 0.3 * mtow + 0.01 * wingLoading * wingArea / GRAVITY;
        
        // Обновление взлётной массы
        mtow = payloadKg + batteryMass + structureMass;
    }
    
    // 5. Финальный расчёт
    const weight = mtow * GRAVITY;
    
    // Площадь крыла
    const wingArea = (2 * weight) / (AIR_DENSITY * speedMs * speedMs * CRUISE_CL);
    
    // Коэффициенты сопротивления
    const inducedDragCoeff = (CRUISE_CL * CRUISE_CL) / 
        (Math.PI * WING_ASPECT_RATIO * WING_EFFICIENCY_FACTOR);
    const totalCD = CD0 + inducedDragCoeff;
    const liftToDragRatio = CRUISE_CL / totalCD;
    
    // Сила сопротивления
    const dragForce = totalCD * 0.5 * AIR_DENSITY * speedMs * speedMs * wingArea;
    
    // Требуемая мощность
    const propPower = (dragForce * speedMs) / PROP_EFFICIENCY;
    const electricPower = propPower / MOTOR_EFFICIENCY;
    
    // Ёмкость батареи
    const batteryWh = (electricPower * enduranceHours) / 0.8;
    
    // Масса батареи
    const batteryMass = batteryWh / BATTERY_ENERGY_DENSITY;
    
    // Нагрузка на крыло
    const wingLoading = weight / wingArea;
    
    // Масса конструкции
    const structureMass = 0.3 * mtow + 0.01 * wingLoading * wingArea / GRAVITY;

    return {
        mtow: +(mtow).toFixed(3),
        batteryWh: Math.ceil(batteryWh),
        batteryMass: +(batteryMass).toFixed(2),
        speed: +(speedMs).toFixed(1),
        power: Math.round(electricPower),
        structureMass: +(structureMass).toFixed(2),
        enduranceHours: +(enduranceHours).toFixed(2),
        rangeKm: +(rangeKm).toFixed(1)
    };
}

    function updateProgressBars(powerW, batteryWh, massKg) {
        // Максимальные значения для прогресс-баров (оптимизированы для малых БПЛА)
        const maxPower = 300;    // 300W максимум для малых аппаратов
        const maxBattery = 500;  // 500Wh максимум
        const maxMass = 5;       // 5kg максимум

        const powerPercent = Math.min((powerW / maxPower) * 100, 100);
        const batteryPercent = Math.min((batteryWh / maxBattery) * 100, 100);
        const massPercent = Math.min((massKg / maxMass) * 100, 100);

        // Анимируем прогресс-бары
        setTimeout(() => {
            powerBar.style.width = powerPercent + '%';
            batteryBar.style.width = batteryPercent + '%';
            massBar.style.width = massPercent + '%';
        }, 100);

        powerValue.textContent = powerW + ' W';
        batteryValue.textContent = batteryWh + ' Wh';
        massValue.textContent = massKg + ' kg';
    }

    form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        const rangeKm = numeric(document.getElementById('range').value);
        const enduranceMin = numeric(document.getElementById('endurance').value);
        const payloadKg = numeric(document.getElementById('payload').value);

        const results = calculateUAVParameters(rangeKm, enduranceMin, payloadKg);

        mtowEl.innerHTML = `${results.mtow}<span class="result-unit">kg</span>`;
        batteryWhEl.innerHTML = `${results.batteryWh}<span class="result-unit">Wh</span>`;
        batteryMassEl.innerHTML = `${results.batteryMass}<span class="result-unit">kg</span>`;
        speedEl.innerHTML = `${results.speed}<span class="result-unit">m/s</span>`;
        powerEl.innerHTML = `${results.power}<span class="result-unit">W</span>`;
        structureMassEl.innerHTML = `${results.structureMass}<span class="result-unit">kg</span>`;

        // Обновляем прогресс-бары
        updateProgressBars(results.power, results.batteryWh, results.mtow);

        // save last result for export
        form.dataset.latest = JSON.stringify({
            timestamp: Date.now(),
            inputs: { rangeKm, enduranceMin, payloadKg },
            results: results
        });
    });

    exportBtn.addEventListener('click', function () {
        const data = form.dataset.latest;
        if (!data) { alert('Сначала выполните расчёт.'); return; }
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `uav-report-${Date.now()}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    });

    // theme toggle
    const themeToggle = document.getElementById('themeToggle');
    const root = document.documentElement;
    function applyTheme(isLight) {
        if (isLight) root.classList.add('light'); else root.classList.remove('light');
        themeToggle.setAttribute('aria-pressed', String(isLight));
        themeToggle.textContent = isLight ? '🌞' : '🌙';
        try { localStorage.setItem('uav_theme_light', isLight ? '1' : '0'); } catch (e) { }
    }
    themeToggle.addEventListener('click', function () { applyTheme(!root.classList.contains('light')); });

    try {
        const saved = localStorage.getItem('uav_theme_light');
        if (saved !== null) applyTheme(saved === '1');
        else applyTheme(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
    } catch (e) { applyTheme(false) }

    // Первоначальный расчёт при загрузке
    form.dispatchEvent(new Event('submit'));

})();