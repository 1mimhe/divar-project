import provinces from "./provinces.json" with { type: "json" };
const selectProvinceElement = document.getElementById("province");

provinces.forEach((province) => {
    const option = document.createElement("option");
    option.value = province.name;
    option.text = province.name;    
    selectProvinceElement.appendChild(option);
});