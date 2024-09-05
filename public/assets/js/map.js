import provinces from "./provinces.json" with { type: "json" };
const selectProvinceElement = document.getElementById("province");

provinces.forEach((province, index) => {
    const option = document.createElement("option");
    option.value = provinces[index].id;
    option.text = province.name;    
    selectProvinceElement.appendChild(option);
});