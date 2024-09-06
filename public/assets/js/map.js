import provinces from "./provinces.json" with { type: "json" };
const selectProvinceElement = document.getElementById("province");

provinces.forEach((province) => {
    const option = document.createElement("option");
    option.value = province.name;
    option.text = province.name;    
    selectProvinceElement.appendChild(option);
});

const selectCityElement = document.getElementById("city");
selectProvinceElement.onchange = async function () {
    selectCityElement.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.text ="لطفا یک شهر را انتخاب کنید.";
    selectCityElement.appendChild(defaultOption);

    const selectedIndex = selectProvinceElement.selectedIndex;

    const cities = await (await fetch(`https://iran-locations-api.ir/api/v1/fa/cities?state_id=${selectedIndex}`)).json();
    cities.forEach((city) => {
        const option = document.createElement("option");
        option.value = city.name;
        option.text = city.name;    
        selectCityElement.appendChild(option);
    });
}