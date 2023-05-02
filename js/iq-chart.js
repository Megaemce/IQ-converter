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
        name: "Raven advanced (raw score)",
        step: 1,
        mean: 17.2, // original 17
        stdDev: 5.14, // original 5.14
        min: 0,
        max: 36,
        iqScale: false,
    },
    {
        name: "Raven standard (raw score)",
        step: 1,
        mean: 47,
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
];
let scale = scales[0];
let labels = []; // [...,-2σ,-σ,Average,+σ,Mensa,...]
let rarity = []; // 1/X
let xValues = []; // used by chart label setting
let pdfData = []; // probability density function data
let worseThan = []; // % of population worse than the result
let betterThan = []; // & of population better than the result

// set legend title based on scale
function setLegendTitle(scale) {
    return (
        `${scale.iqScale ? "IQ" : "Point"}` +
        " distribution in " +
        scale.name +
        "'s scale with value between " +
        scale.min +
        "-" +
        scale.max +
        " mean " +
        scale.mean +
        " and standard deviation of " +
        scale.stdDev
    );
}

// change scale to new value
function setScale(value) {
    if (scales[value]) {
        scale = scales[value];
        seedData(scale);
        myChart.data.labels = xValues;
        myChart.data.datasets[0].data = pdfData;
        myChart.data.datasets[1].data = betterThan;
        myChart.data.datasets[2].data = worseThan;
        myChart.data.datasets[3].data = rarity;
        myChart.options.plugins.legend.title.text = setLegendTitle(scale);
        myChart.update();
    }
}

// calculate sigma value from given result in specific scale
function sigmaValue(score, scale) {
    return (score - scale.mean) / scale.stdDev;
}

// calculate score/IQ in specific scale from given sigma
function sigmaToScale(sigma, scale) {
    return sigma * scale.stdDev + scale.mean;
}

// translate value from one scale to another
function translateScore(score, oldScale, newScale) {
    const sigma = sigmaValue(score, oldScale);
    const result = sigmaToScale(sigma, newScale);

    // math.round((score - oldScale.mean) / oldScale.stdDev * newScale.stdDev) + newScale.mean;
    return result;
}

// calculate probability density function (PDF)
function pdf(x) {
    const variance = scale.stdDev ** 2;
    const exponent = -((x - scale.mean) ** 2) / (2 * variance);
    const coefficient = 1 / math.sqrt(2 * math.PI * variance);
    return coefficient * math.exp(exponent);
}

// calculate cumulative distribution function (CDF)
function cdf(x) {
    const arg = (x - scale.mean) / (scale.stdDev * math.sqrt(2));
    const erfValue = math.erf(arg);
    const result = 0.5 * (1 + erfValue);
    return result;
}

// seeds the data for the plot
function seedData(scale) {
    const leftSigmasLenght = math.floor(
        (scale.mean - scale.min) / scale.stdDev
    );
    const rightSigmasLenght = math.floor(
        (scale.max - scale.mean) / scale.stdDev
    );

    // reset the data
    labels = []; // [...,-2σ,-σ,Average,+σ,Mensa,...]
    rarity = []; // 1/X
    xValues = [];
    pdfData = []; // probability density function data
    worseThan = []; // % of population worse than the result
    betterThan = []; // & of population better than the result

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

    for (let i = scale.min; i <= scale.max; i += scale.step) {
        const pdfPoint = {};
        const pdfValue = pdf(i); // percentage of people with this value
        const cdfValue = cdf(i); // sum of the pdf values till this value
        const worsePerc = 100 - 100 * cdfValue; // total percentage of people with this value or higher
        const betterPerc = 100 * cdfValue; // total percentage of people with this value or lower
        const rarityLower = 1 / cdfValue; // rarity below mean
        const rarityHigher = 1 / (1 - cdfValue); // rarity above mean

        xValues.push(i);
        pdfPoint.x = i;
        pdfPoint.y = Math.round(pdfValue * population);

        // if only one value is pushed it becomes y, which x from default
        pdfData.push(pdfPoint);
        worseThan.push(worsePerc);
        betterThan.push(betterPerc);

        // belowe mean rarirty comes to 1 and I want to have rarity for those people too
        i < scale.mean ? rarity.push(rarityLower) : rarity.push(rarityHigher);
    }
}

// create the chart
seedData(scale);
let ctx = document.getElementById("myChart").getContext("2d");
let myChart = new Chart(ctx, {
    type: "line",
    data: {
        labels: xValues,
        datasets: [
            {
                label: "Number of people with this IQ",
                data: pdfData,
                radius: 2,
                fill: true,
                // make bgcolor blue for iq >= +2σ, and red for <= -2σ
                segment: {
                    backgroundColor: (ctx) => {
                        let iq = pdfData[ctx.p0DataIndex].x;
                        if (iq < scale.mean - 2 * scale.stdDev)
                            return "rgba(245, 40, 145, 0.5)";
                        if (iq >= scale.mean + 2 * scale.stdDev)
                            return "rgba(12, 130, 248, 0.5)";

                        return "rgba(0,0,0,0.1)";
                    },
                },
                xAxisID: "x",
                yAxisID: "y",
            },
            {
                label: "Better than",
                data: betterThan,
                radius: 2,
                borderWidth: 1,
                xAxisID: "comparisonX",
                yAxisID: "comparisonY",
                hidden: false,
            },
            {
                label: "Worse than",
                data: worseThan,
                radius: 2,
                borderWidth: 1,
                xAxisID: "comparisonX",
                yAxisID: "comparisonY",
                hidden: false,
            },
            {
                label: "Rarity",
                data: rarity,
                radius: 2,
                borderWidth: 1,
                xAxisID: "rarityX",
                yAxisID: "rarityY",
                hidden: false,
            },
        ],
    },
    options: {
        interaction: {
            intersect: false,
            mode: "index",
        },
        plugins: {
            legend: {
                title: {
                    display: true,
                    text: setLegendTitle(scale),
                },
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || "";

                        if (label === "Better than" || label === "Worse than") {
                            return (
                                label +
                                " " +
                                context.parsed.y.toFixed(5) +
                                "% or " +
                                math
                                    .round(
                                        (population * context.parsed.y) / 100
                                    )
                                    .toLocaleString("pl") +
                                " people"
                            );
                        } else if (label === "Rarity") {
                            return (
                                label +
                                ": " +
                                parseInt(
                                    context.parsed.y.toFixed(0)
                                ).toLocaleString("pl")
                            );
                        }

                        return (
                            label + ": " + context.parsed.y.toLocaleString("pl")
                        );
                    },
                },
            },
        },
        responsive: true,
        scales: {
            // X from default scale. Return value that matched ones from labels array
            x: {
                grid: {
                    display: false,
                    drawTicks: false,
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
                },
                position: "bottom",
            },
            // Y from default scale.
            // show the sum of the percent of the cases under the curve from given y value
            y: {
                grid: { display: false },
                position: "right",
                display: false,
            },
            // X from betterThan/worseThan scale. Return only values from standard derivation
            // TODO: this is not good approach - this should return like evey 10th or something like this
            comparisonX: {
                grid: { display: false },
                ticks: {
                    callback: function (value) {
                        const xValue = this.getLabelForValue(value);
                        let resultValue;

                        labels.forEach((label) => {
                            if (label.value == xValue) resultValue = xValue;
                            return;
                        });

                        return resultValue;
                    },
                },
                position: "bottom",
            },
            // Y from betterThan/worseThan scale. Don't show the ticks
            comparisonY: {
                grid: { display: false },
                position: "right",
                display: false,
            },
            // X from rarity. Don't show the ticks
            rarityX: {
                grid: { display: false },
                display: false,
                position: "bottom",
            },
            // Y from rarity. Don't show the ticks
            rarityY: {
                grid: { display: false },
                display: false,
                position: "left",
                type: "logarithmic",
            },
        },
    },
});
