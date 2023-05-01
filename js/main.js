import { calculate, clearValues } from "./iq-calculator.js";

function setLastFocus(formName) {
    document.getElementById("lastFocusForm").value = formName;
    console.log(formName);
}

document.getElementById("gre").onfocus = setLastFocus("gre");
document.getElementById("sat").onfocus = setLastFocus("sat");
document.getElementById("stdDev").onfocus = setLastFocus("stdDev");
document.getElementById("rarity").onfocus = setLastFocus("rarity");
document.getElementById("cattell").onfocus = setLastFocus("cattell");
document.getElementById("wechsler").onfocus = setLastFocus("wechsler");
document.getElementById("percentile").onfocus = setLastFocus("percentile");
document.getElementById("stanfordBinet").onfocus =
    setLastFocus("stanfordBinet");

document.getElementById("calc").onclick = calculate();
document.getElementById("clear").onclick = clearValues();

// calculcate when enter is clicked
document.onkeydown = (event) => {
    event.key === "Enter" && calculate();
};
