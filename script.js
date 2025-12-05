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
        
        // 2. Расчёт крейсерской скорости
        const speedMs = (rangeKm * 1000) / (enduranceHours * 3600);
        const speedKmh = speedMs * 3.6;
        
        // 3. Реалистичные константы и коэффициенты
        const AIR_DENSITY = 1.225; // кг/м³
        const GRAVITY = 9.81; // м/с²
        const BATTERY_ENERGY_DENSITY = 200; // Wh/kg (реалистично для LiPo)
        const MOTOR_EFFICIENCY = 0.80; // Реалистичный КПД
        const PROP_EFFICIENCY = 0.65; // Реалистичный КПД винта
        
        // Аэродинамические параметры для малого БПЛА
        const WING_ASPECT_RATIO = 6; // Удлинение крыла
        const WING_EFFICIENCY_FACTOR = 0.80;
        const CRUISE_CL = 0.6; // Более реалистичный CL
        const CD0 = 0.035; // Паразитное сопротивление
        
        // 4. Начальная оценка (более реалистичная)
        let mtow = Math.max(payloadKg * 6, 2.5); // Минимум 2.5 кг для БПЛА такого класса
        
        // 5. Итерационный расчёт
        for (let iteration = 0; iteration < 10; iteration++) {
            const weight = mtow * GRAVITY;
            
            // Площадь крыла
            const wingArea = (2 * weight) / (AIR_DENSITY * speedMs * speedMs * CRUISE_CL);
            
            // Размах крыла
            const wingspan = Math.sqrt(WING_ASPECT_RATIO * wingArea);
            
            // Индуктивное сопротивление
            const inducedDragCoeff = (CRUISE_CL * CRUISE_CL) / 
                (Math.PI * WING_ASPECT_RATIO * WING_EFFICIENCY_FACTOR);
            const totalCD = CD0 + inducedDragCoeff;
            
            // Сила сопротивления
            const dragForce = totalCD * 0.5 * AIR_DENSITY * speedMs * speedMs * wingArea;
            
            // Мощность
            const propPower = (dragForce * speedMs) / PROP_EFFICIENCY;
            const electricPower = propPower / MOTOR_EFFICIENCY;
            
            // Ёмкость батареи (с запасом 25%)
            const batteryWh = (electricPower * enduranceHours) / 0.75;
            const batteryMass = batteryWh / BATTERY_ENERGY_DENSITY;
            
            // Нагрузка на крыло
            const wingLoading = weight / wingArea;
            
            // Масса конструкции (более реалистичная оценка)
            // Для малых БПЛА: структура ~30-40% от MTOW
            const structureMass = 0.35 * mtow + 0.5; // Базовый минимум 0.5 кг
            
            // Системное оборудование (автопилот, телеметрия и т.д.)
            const avionicsMass = 0.3;
            
            // Обновление MTOW
            mtow = payloadKg + batteryMass + structureMass + avionicsMass;
            
            // Ограничение минимальной массы
            mtow = Math.max(mtow, 2.5);
        }
        
        // 6. Финальный расчёт
        const weight = mtow * GRAVITY;
        const wingArea = (2 * weight) / (AIR_DENSITY * speedMs * speedMs * CRUISE_CL);
        const wingLoading = weight / wingArea;
        
        const inducedDragCoeff = (CRUISE_CL * CRUISE_CL) / 
            (Math.PI * WING_ASPECT_RATIO * WING_EFFICIENCY_FACTOR);
        const totalCD = CD0 + inducedDragCoeff;
        const liftToDragRatio = CRUISE_CL / totalCD;
        
        const dragForce = totalCD * 0.5 * AIR_DENSITY * speedMs * speedMs * wingArea;
        const propPower = (dragForce * speedMs) / PROP_EFFICIENCY;
        const electricPower = propPower / MOTOR_EFFICIENCY;
        
        const batteryWh = (electricPower * enduranceHours) / 0.75;
        const batteryMass = batteryWh / BATTERY_ENERGY_DENSITY;
        
        const structureMass = 0.35 * mtow + 0.5;
        const avionicsMass = 0.3;

        return {
            mtow: +(mtow).toFixed(2),
            batteryWh: Math.ceil(batteryWh),
            batteryMass: +(batteryMass).toFixed(2),
            speed: +(speedMs).toFixed(1),
            power: Math.round(electricPower),
            structureMass: +((structureMass + avionicsMass)).toFixed(2),
            enduranceHours: +(enduranceHours).toFixed(2),
            rangeKm: +(rangeKm).toFixed(1),
            // Дополнительные реалистичные параметры
            wingArea: +(wingArea).toFixed(2),
            wingspan: +(Math.sqrt(WING_ASPECT_RATIO * wingArea)).toFixed(2),
            wingLoading: +(wingLoading).toFixed(1),
            liftToDrag: +(liftToDragRatio).toFixed(1),
            thrustRequired: +(dragForce).toFixed(1)
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