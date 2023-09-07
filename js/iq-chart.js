// * GLOBAL CONST * //
const population = 8029026082;
const scales = [
    {
        name: "Wechsler",
        step: 1,
        mean: 100,
        stdDev: 15,
        min: 0,
        max: 195,
        iqScale: true,
    },
    {
        name: "Standford-Binet",
        step: 1,
        mean: 100,
        stdDev: 16,
        min: 0,
        max: 202,
        iqScale: true,
    },
    {
        name: "Cattell",
        step: 1,
        mean: 100,
        stdDev: 24,
        min: 0,
        max: 254,
        iqScale: true,
    },
    {
        name: "RAPM",
        step: 1,
        mean: 17,
        stdDev: 5.29,
        min: 0,
        max: 36,
        iqScale: false,
    },
    {
        name: "RSPM",
        step: 1,
        mean: 51.32,
        stdDev: 4.69,
        min: 16,
        max: 60,
        iqScale: false,
    },
    {
        name: "Otis-Lennon",
        step: 1,
        mean: 108.43,
        stdDev: 8.77,
        min: 52,
        max: 164,
        iqScale: false,
    },
    {
        name: "Custom",
        step: 1,
        mean: 100,
        stdDev: 15,
        min: 0,
        max: 180,
        iqScale: false,
    },
];

// * GLOBAL VARIABLES * //
let scale = scales[0]; // choosen scale
let labels = []; // array of labels: [...,-2σ,-σ,Average,+σ,Mensa,...]
let rarity = []; // array of rarity values
let userStd = undefined; // user standard deviation
let xValues = []; // array used by chart label setting
let pdfData = []; // array of probability density function values
let worseThan = []; // array of % of population worse than the result values
let userValue = undefined; // user score default value
let betterThan = []; // array of % of population better than the result values
let userOriginalValue = undefined; // when user change slider value can changed too

// * FUNCTION * //
// set legend title based on scale. Used when scale is changed
function setLegendTitle(scale) {
    return (
        `${scale.iqScale ? "IQ" : "Point"}` +
        " distribution in " +
        scale.name +
        "'s scale with values between " +
        scale.min +
        "-" +
        scale.max +
        " mean " +
        scale.mean +
        " and standard deviation of " +
        scale.stdDev
    );
}

// calculate sigma from given score in specific scale
function scoreToSigma(score, scale) {
    return (score - scale.mean) / scale.stdDev;
}

// calculate score in specific scale from given sigma
function sigmaToScale(sigma, scale) {
    let result = sigma * scale.stdDev + scale.mean;

    if (result >= scale.max) result = scale.max;
    if (result <= scale.min) result = scale.min;

    return result;
}

// convert value from one scale to another
function convertScore(score, oldScale, newScale) {
    const sigma = scoreToSigma(score, oldScale);
    const result = sigmaToScale(sigma, newScale);

    return result;
}

// calculate probability density function (PDF)
function pdf(x) {
    const variance = scale.stdDev ** 2;
    const exponent = -((x - scale.mean) ** 2) / (2 * variance);
    const coefficient = 1 / math.sqrt(2 * math.PI * variance);
    const result = coefficient * math.exp(exponent);

    return result;
}

// calculate cumulative distribution function (CDF)
function cdf(x) {
    const arg = (x - scale.mean) / (scale.stdDev * math.sqrt(2));
    const erfValue = math.erf(arg);
    const result = 0.5 * (1 + erfValue);

    return result;
}

// seeds the data for the plot in specific scale
function seedData(scale) {
    const leftSigmasLenght = math.floor(
        (scale.mean - scale.min) / scale.stdDev
    );
    const rightSigmasLenght = math.floor(
        (scale.max - scale.mean) / scale.stdDev
    );

    // seed is used when switching scales hence the need to recalculate the data
    labels = [];
    rarity = [];
    xValues = [];
    pdfData = [];
    worseThan = [];
    betterThan = [];

    // add correct label for every standard deviations
    for (let i = -leftSigmasLenght; i <= rightSigmasLenght; i += 1) {
        const label = {};
        let labelName = "";

        if (i < 0) labelName = i + "σ";
        if (i > 0) labelName = "+" + i + "σ";
        if (i == 0) labelName = "Mean";
        if (i == 2) labelName = "Mensa";

        label.name = labelName;
        label.value = scale.mean + i * scale.stdDev;

        labels.push(label);
    }

    // seed pdfData, worseThan, betterThan and rarity data
    for (let i = scale.min; i <= scale.max; i += scale.step) {
        const pdfPoint = {};
        const pdfValue = pdf(i); // percentage of people with this value
        const cdfValue = cdf(i); // sum of the pdf values till this value
        const worsePerc = 100 - 100 * cdfValue; // total percentage of people with this value or higher
        const betterPerc = 100 * cdfValue; // total percentage of people with this value or lower
        const rarityLower = 1 / cdfValue; // rarity below mean
        const rarityHigher = 1 / (1 - cdfValue); // rarity above mean

        pdfPoint.x = i;
        pdfPoint.y = Math.round(pdfValue * population);

        xValues.push(i);
        pdfData.push(pdfPoint);
        worseThan.push(worsePerc);
        betterThan.push(betterPerc);

        // belowe mean rarirty comes to 1 and I want to have rarity for those people too
        i < scale.mean ? rarity.push(rarityLower) : rarity.push(rarityHigher);
    }
}

// seed and replace data
function replaceData() {
    seedData(scale);
    // push the new data into chart
    myChart.data.labels = xValues;
    myChart.data.datasets[0].data = pdfData;
    myChart.data.datasets[1].data = betterThan;
    myChart.data.datasets[2].data = worseThan;
    myChart.data.datasets[3].data = rarity;
}

// set user value on the chart. Used by score input
function setUserValue(value) {
    // set the global user value
    userValue = Math.floor(value);
    userOriginalValue = userValue;

    // trim the value if it exceed the scale range
    if (userValue >= scale.max) userValue = scale.max;
    if (userValue <= scale.min) userValue = scale.min;

    // push the new line into the chart
    myChart.data.datasets[4].data = [
        { x: userValue, y: 0 },
        { x: userValue, y: pdfData[userValue - scale.min].y },
    ];

    // by default when the value is not set the x axe is hidden
    myChart.data.datasets[4].hidden = false;
    myChart.options.scales["userScoreX"].display = true;

    // set global user standard deviation
    userStd = scoreToSigma(userValue, scale);
    myChart.update();
}

// switch to the new scale of given value
function switchToScale(value) {
    if (scales[value]) {
        // hide the custom section
        document.getElementById("controls").classList.add("hidden");
        // set global scale value
        scale = scales[value];
        // convert previous user score to new scale
        userValue = Math.round(sigmaToScale(userStd, scale));

        replaceData();

        // user can just switch scales without providing own score
        if (userValue) {
            myChart.data.datasets[4].data = [
                { x: userValue, y: 0 },
                // some scales have min ≥ 0 thus causing pdfData[userValue] to exceed its range
                { x: userValue, y: pdfData[userValue - scale.min].y },
            ];
        }
        // push the new title
        myChart.options.plugins.legend.title.text = setLegendTitle(scale);
        myChart.update();
    }

    // if custom then make the custom section visible
    if (value == "6") {
        document.getElementById("controls").classList.remove("hidden");
    }
}

// function used on sliders
function customSliderChangeTo(sliderValue, property) {
    scale[property] = parseInt(sliderValue);
    replaceData();
    if (userOriginalValue) setUserValue(userOriginalValue);
    myChart.options.plugins.legend.title.text = setLegendTitle(scale);
    myChart.update();
}

// * INIT * //
// create the initial data from default scale
seedData(scale);

// create the chart using seeded data
let ctx = document.getElementById("myChart").getContext("2d");
let myChart = new Chart(ctx, {
    type: "line",
    data: {
        labels: xValues,
        datasets: [
            {
                data: pdfData,
                fill: true,
                label: "Number of people with this IQ",
                order: 6,
                radius: 2,
                segment: {
                    // make bgcolor blue for iq >= +2σ, and red for <= -2σ
                    backgroundColor: (ctx) => {
                        let iq = pdfData[ctx.p0DataIndex].x;
                        if (iq < scale.mean - 2 * scale.stdDev)
                            return "rgba(254, 95, 85,0.5)";
                        if (iq >= scale.mean + 2 * scale.stdDev)
                            return "rgba(100, 141, 229,0.5)";

                        return "rgba(0,0,0,0.02)";
                    },
                },
                xAxisID: "x",
                yAxisID: "y",
                borderColor: "#1F80E0",
                backgroundColor: "#1F80E0",
            },
            {
                data: betterThan,
                label: "Better than",
                order: 4,
                radius: 2,
                hidden: true,
                xAxisID: "comparisonX",
                yAxisID: "comparisonY",
                borderWidth: 1,
                borderColor: "#7fb685",
                backgroundColor: "#7fb685",
            },
            {
                data: worseThan,
                label: "Worse than",
                order: 3,
                radius: 2,
                hidden: true,
                xAxisID: "comparisonX",
                yAxisID: "comparisonY",
                borderWidth: 1,
                borderColor: "#ec4e20",
                backgroundColor: "#ec4e20",
            },
            {
                data: rarity,
                label: "Rarity",
                order: 5,
                radius: 2,
                hidden: true,
                xAxisID: "rarityX",
                yAxisID: "rarityY",
                borderWidth: 1,
                borderColor: "#f2c57c",
                backgroundColor: "#f2c57c",
            },
            {
                label: "Your score",
                order: 9,
                radius: 4,
                hidden: true,
                xAxisID: "userScoreX",
                yAxisID: "y",
                borderColor: "#00d4ff",
                backgroundColor: "#00d4ff",
            },
        ],
    },
    options: {
        responsive: true,
        interaction: {
            intersect: false,
            mode: "index",
        },
        plugins: {
            legend: {
                title: {
                    display: true,
                    text: setLegendTitle(scale),
                    padding: {
                        bottom: 10,
                    },
                    font: {
                        size: 14,
                        family: "Verdana, Geneva, Tahoma, sans-serif",
                    },
                },
                labels: {
                    font: {
                        size: 12,
                        family: "Verdana, Geneva, Tahoma, sans-serif",
                    },
                },
                reverse: true,
            },
            tooltip: {
                callbacks: {
                    // modify oryginal behavior based on label. Mostly fix number of digits
                    label: function (context) {
                        const label = context.dataset.label || "";
                        let result = label;

                        if (label === "Better than" || label === "Worse than") {
                            result =
                                label +
                                " " +
                                context.parsed.y.toFixed(5) +
                                "% or " +
                                math
                                    .round(
                                        (population * context.parsed.y) / 100
                                    )
                                    .toLocaleString("pl") +
                                " people";
                        } else if (label === "Rarity") {
                            result =
                                label +
                                ": " +
                                parseInt(
                                    context.parsed.y.toFixed(0)
                                ).toLocaleString("pl");
                        } else {
                            result =
                                label +
                                ": " +
                                context.parsed.y.toLocaleString("pl");
                        }

                        return result;
                    },
                },
            },
        },
        scales: {
            // X from default scale. Return value that matched ones from labels array
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    autoSkip: false,
                    maxRotation: 0,
                    callback: function (value) {
                        const xValue = this.getLabelForValue(value);
                        let omega = "";

                        labels.forEach((label) => {
                            if (label.value == xValue) {
                                omega = label.name;
                                return;
                            }
                        });

                        return omega;
                    },
                    font: {
                        size: 12,
                        family: "Verdana, Geneva, Tahoma, sans-serif",
                    },
                },
                position: "bottom",
            },
            // Y from default scale
            y: {
                position: "right",
                display: false,
            },
            // X from betterThan/worseThan scale. Second visible x axes
            // returns same number of ticks as number of omegas
            comparisonX: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                    maxTicksLimit: (-scale.min + scale.max) / scale.stdDev,
                },
                position: "bottom",
            },
            // Y from betterThan/worseThan scale. Don't show
            comparisonY: {
                position: "right",
                display: false,
            },
            // X from rarity. Don't show
            rarityX: {
                display: false,
                position: "bottom",
            },
            // Y from rarity. Don't show
            rarityY: {
                display: false,
                position: "left",
                type: "logarithmic",
            },
            // X from user score
            userScoreX: {
                position: "top",
                display: false,
                border: {
                    display: false,
                },
                grid: { display: true },
                ticks: {
                    callback: function (value) {
                        const xValue = this.getLabelForValue(value);

                        if (xValue === userValue) return `You (${xValue})`;
                        return undefined;
                    },
                },
                font: {
                    size: 12,
                    family: "Verdana, Geneva, Tahoma, sans-serif",
                },
            },
        },
    },
});
