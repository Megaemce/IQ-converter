let iqForm = document.getElementById("iqForm");

// return form value if it is not empty otherwise defaultValue
function getFormValueOrDefault(formName) {
    if (!formName.value) {
        formName.value = formName.attributes.defaultValue.value;
    }
    return parseFloat(formName.value);
}

// Use divisor 1.5 for mapping to StanfordBinet IQ
function cattellToStanfordBinet() {
    const cattellValue = getFormValueOrDefault(iqForm.cattell);
    const stanfordBinetValue = Math.round((cattellValue + 50.0) / 1.5);

    if (cattellValue < 0) {
        alert("IQ Cattell must be >= 0");
        clearValues();
        iqForm.cattell.focus();
        return false;
    }

    iqForm.stanfordBinet.value = stanfordBinetValue;
    return true;
}

// Use multiplier 1.5 for mapping to Cattell IQ
function stanfordBinetToCattell() {
    const stanfordBinetValue = getFormValueOrDefault(iqForm.stanfordBinet);
    const cattellValue = Math.round(1.5 * stanfordBinetValue - 50.0);

    if (stanfordBinetValue < 0) {
        alert("IQ Stanford-Binet must be >= 0");
        clearValues();
        iqForm.stanfordBinet.focus();
        return false;
    }

    iqForm.cattell.value = cattellValue;
    return true;
}

// Use 16 StanfordBinet IQ points for each standard deviation
function stdDevToStanfordBinet() {
    const stdDevValue = getFormValueOrDefault(iqForm.stdDev);
    const stanfordBinetValue = Math.round(stdDevValue * 16) + 100;

    if (stdDevValue < -6.25) {
        alert("Standard deviation must be >= -6.25");
        clearValues();
        iqForm.stdDev.focus();
        return false;
    }

    iqForm.stanfordBinet.value = stanfordBinetValue;
    return true;
}

// Use 16 StanfordBinet IQ points for each standard deviation
function stanfordBinetToStdDev() {
    const stanfordBinetValue = getFormValueOrDefault(iqForm.stanfordBinet);
    const stdDevValue = (stanfordBinetValue - 100) / 16;

    iqForm.stdDev.value = stdDevValue;
}

// Calculate percentile from standard deviation using Normal Distribution.
// Q(x):e(x) < 7.5 * 10^-8
function stdDevToPercentile() {
    const b1 = 0.31938153;
    const b2 = -0.356563782;
    const b3 = 1.781477937;
    const b4 = -1.821255978;
    const b5 = 1.330274429;
    const r = 0.2316419;
    const stdDevValue = getFormValueOrDefault(iqForm.stdDev);

    let Fx;
    let x;
    let t;
    let Qx;
    let perc;

    x = Math.abs(stdDevValue);

    // Density function
    Fx = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-Math.pow(x, 2) / 2);

    // Compute tail area (Qx) using polynomial approximation
    t = 1 / (1 + r * x);

    Qx =
        Fx *
        (b1 * t +
            b2 * Math.pow(t, 2) +
            b3 * Math.pow(t, 3) +
            b4 * Math.pow(t, 4) +
            b5 * Math.pow(t, 5));

    if (stdDevValue < 0) Qx = 1 - Qx;

    // Percentile from tail area
    perc = (1 - Qx) * 100;
    perc = round(perc, 3);

    iqForm.percentile.value = perc;
}
// Calculate standard deviation from percentile using inverse Normal Distribution
// x:e(Q(x)) < 4.5 * 10^-4
function percentileToStdDev() {
    const c0 = 2.515517;
    const c1 = 0.802853;
    const c2 = 0.010328;
    const d1 = 1.432788;
    const d2 = 0.189269;
    const d3 = 0.001308;
    const percentileValue = getFormValueOrDefault(iqForm.percentile);

    let Qx;
    let t;
    let x;

    if (percentileValue < 13 || percentileValue > 99.9999999999) {
        alert("Percentile must be >= 13 and <= 99.999999999");
        clearValues();
        iqForm.percentile.focus();
        return false;
    }

    // Tail area from percentile
    Qx = 1 - percentileValue / 100;
    // Compute standard deviation (x) using rational approximation
    t = Math.sqrt(Math.log(1 / Math.pow(Qx, 2)));

    x =
        t -
        (c0 + c1 * t + c2 * Math.pow(t, 2)) /
            (1 + d1 * t + d2 * Math.pow(t, 2) + d3 * Math.pow(t, 3));

    x = round(x, 3);

    iqForm.stdDev.value = x;

    return true;
}

// Calculate rarity from percentile, 1/X
function percentileToRarity() {
    const percentileValue = getFormValueOrDefault(iqForm.percentile);
    const rarityValue = Math.round(1 / (1 - percentileValue / 100));

    iqForm.rarity.value = rarityValue;
}

// Calculate percentile from rarity, inverse 1/X
function rarityToPercentile() {
    const rarityValue = getFormValueOrDefault(iqForm.rarity);
    const percentileValue = round((100 * (rarityValue - 1)) / rarityValue, 3);

    if (rarityValue < 2) {
        alert("Rarity must be >= 2");
        clearValues();
        iqForm.rarity.focus();
        return false;
    }

    iqForm.percentile.value = percentileValue;

    return true;
}

// Use divisor 16/15 for mapping to Wechsler IQ
function stanfordBinetToWechsler() {
    const stanfordBinetValue = getFormValueOrDefault(iqForm.stanfordBinet);
    const wechslerValue = Math.round(
        (15 * (stanfordBinetValue - 100)) / 16 + 100
    );

    iqForm.wechsler.value = wechslerValue;
}

// Use multiplier 16/15 for mapping to StanfordBinet IQ
function wechlserToStanfordBinet() {
    const wechslerValue = getFormValueOrDefault(iqForm.wechsler.value);
    const stanfordBinetValue = Math.round(
        (16 * (wechslerValue - 100)) / 15 + 100
    );

    if (wechslerValue < 0) {
        alert("IQ Wechsler must be >= 0");
        clearValues();
        iqForm.wechsler.focus();
        return false;
    }

    iqForm.stanfordBinet.value = stanfordBinetValue;

    return true;
}

// Used Rodrigo de la Jara's formula
function stanfordBinetToGRE() {
    const stanfordBinetValue = getFormValueOrDefault(iqForm.stanfordBinet);
    const greValue = Math.round((stanfordBinetValue - 26.8) / 0.085);

    iqForm.gre.value = greValue;
}

// Used Rodrigo de la Jara's formula
function greToStanfordBinet() {
    const greValue = getFormValueOrDefault(iqForm.gre);
    const stanfordBinetValue = Math.round(26.8 + 0.085 * greValue);

    if (greValue < 70) {
        alert("GRE score must be >= 70");
        clearValues();
        iqForm.gre.focus();
        return false;
    }

    iqForm.stanfordBinet.value = stanfordBinetValue;

    return true;
}

// Used Rodrigo de la Jara's formula
function stanfordBinetToSAT() {
    const stanfordBinetValue = getFormValueOrDefault(iqForm.stanfordBinet);
    const satValue = Math.round((stanfordBinetValue - 2.918) / 0.1033);

    iqForm.sat.value = satValue;
}

// Used Rodrigo de la Jara's formula
function satToStanfordBinet() {
    const satValue = getFormValueOrDefault(iqForm.sat);
    const stanfordBinetValue = Math.round(2.918 + 0.1033 * satValue);

    if (satValue < 290) {
        alert("SAT score must be >= 290");
        clearValues();
        iqForm.sat.focus();
        return false;
    }

    iqForm.stanfordBinet.value = stanfordBinetValue;

    return true;
}

// round in some strange way?
function round(num, d) {
    const n = Math.pow(10, !d ? 2 : d);
    return Math.round(num * n) / n;
}

function setLastFocus(formName) {
    document.getElementById("lastFocusForm").value = formName;
    console.log(formName);
}

// Handle calculation flow
function calculate() {
    switch (document.getElementById("lastFocusForm").value) {
        case "stanfordBinet":
            if (!stanfordBinetToCattell()) return;
            stanfordBinetToWechsler();
            stanfordBinetToGRE();
            stanfordBinetToStdDev();
            stanfordBinetToSAT();
            stdDevToPercentile();
            percentileToRarity();
            break;
        case "cattell":
            if (!cattellToStanfordBinet()) return;
            stanfordBinetToWechsler();
            stanfordBinetToGRE();
            stanfordBinetToStdDev();
            stanfordBinetToSAT();
            stdDevToPercentile();
            percentileToRarity();
            break;
        case "wechsler":
            if (!wechlserToStanfordBinet()) return;
            stanfordBinetToGRE();
            stanfordBinetToCattell();
            stanfordBinetToStdDev();
            stanfordBinetToSAT();
            stdDevToPercentile();
            percentileToRarity();
            break;
        case "stdDev":
            if (!stdDevToStanfordBinet()) return;
            stanfordBinetToWechsler();
            stanfordBinetToCattell();
            stanfordBinetToSAT();
            stanfordBinetToGRE();
            stdDevToPercentile();
            percentileToRarity();
            break;
        case "gre":
            if (!greToStanfordBinet()) return;
            stanfordBinetToWechsler();
            stanfordBinetToCattell();
            stanfordBinetToStdDev();
            stanfordBinetToSAT();
            stdDevToPercentile();
            percentileToRarity();
            break;
        case "sat":
            if (!satToStanfordBinet()) return;
            stanfordBinetToWechsler;
            stanfordBinetToCattell();
            stanfordBinetToStdDev();
            stanfordBinetToGRE();
            stdDevToPercentile();
            percentileToRarity();
            break;
        case "percentile":
            if (!percentileToStdDev()) return;
            stdDevToStanfordBinet();
            stanfordBinetToWechsler();
            stanfordBinetToSAT();
            stanfordBinetToGRE();
            stanfordBinetToCattell();
            percentileToRarity();
            break;
        case "rarity":
            if (!rarityToPercentile()) return;
            percentileToStdDev();
            stdDevToStanfordBinet();
            stanfordBinetToCattell();
            stanfordBinetToWechsler();
            stanfordBinetToSAT();
            stanfordBinetToGRE();
            break;
    }
}

// set all the value to null
function clearValues() {
    iqForm.stanfordBinet.value = "";
    iqForm.cattell.value = "";
    iqForm.wechsler.value = "";
    iqForm.gre.value = "";
    iqForm.sat.value = "";
    iqForm.stdDev.value = "";
    iqForm.percentile.value = "";
    iqForm.rarity.value = "";
}

// calculcate when enter is clicked
document.onkeydown = (event) => {
    event.key === "Enter" && calculate();
};
