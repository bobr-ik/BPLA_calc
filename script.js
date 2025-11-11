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
        // Рассчитываем крейсерскую скорость (м/с)
        const enduranceHours = enduranceMin / 60;
        const speedMs = (rangeKm * 1000) / (enduranceHours * 3600);

        // Базовые коэффициенты для самолётного БПЛА
        const structureCoefficient = 0.4; // Коэффициент массы конструкции
        const batteryEnergyDensity = 250; // Wh/kg - плотность энергии батареи
        const propEfficiency = 0.7; // КПД силовой установки
        const liftToDragRatio = 12; // Аэродинамическое качество

        // Оценка взлётной массы
        const emptyMass = payloadKg * 2.5; // Базовая оценка массы пустого БПЛА
        let mtow = emptyMass + payloadKg;

        // Уточнённая оценка с итерацией
        for (let i = 0; i < 3; i++) {
            // Требуемая мощность
            const weight = mtow * 9.81; // Н
            const requiredThrust = weight / liftToDragRatio; // Н
            const powerW = (requiredThrust * speedMs) / propEfficiency;

            // Ёмкость аккумулятора
            const batteryWh = (powerW * enduranceHours) / 0.85; // С учётом потерь

            // Масса батареи
            const batteryMass = batteryWh / batteryEnergyDensity;

            // Обновляем взлётную массу
            mtow = payloadKg + batteryMass + (mtow * structureCoefficient);
        }

        // Финальный расчёт
        const weight = mtow * 9.81;
        const requiredThrust = weight / liftToDragRatio;
        const powerW = (requiredThrust * speedMs) / propEfficiency;
        const batteryWh = (powerW * enduranceHours) / 0.85;
        const batteryMass = batteryWh / batteryEnergyDensity;
        const structureMass = mtow * structureCoefficient;

        return {
            mtow: +(mtow).toFixed(3),
            batteryWh: Math.ceil(batteryWh),
            batteryMass: +(batteryMass).toFixed(2),
            speed: +(speedMs).toFixed(1),
            power: Math.round(powerW),
            structureMass: +(structureMass).toFixed(2),
            enduranceHours,
            rangeKm
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