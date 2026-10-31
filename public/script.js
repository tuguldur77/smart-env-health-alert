async function loadDistrictAir() {
  if (!navigator.geolocation) {
    alert("❌ 위치 정보를 사용할 수 없습니다.");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    console.log("📍 현재 위치:", lat, lon);

    const res = await fetch(`/api/air?lat=${lat}&lon=${lon}`);
    const data = await res.json();

    document.getElementById("airInfo").innerText =
      `${data.district}의 미세먼지: PM10 ${data.pm10}, PM2.5 ${data.pm25}, 등급: ${data.grade}`;
  });
}

// Call automatically when page loads
window.onload = loadDistrictAir;
