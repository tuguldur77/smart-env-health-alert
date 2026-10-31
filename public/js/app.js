// 안전: DOM이 모두 만들어진 뒤에 요소를 찾고 이벤트를 바인딩한다
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 DOM Content Loaded - initializing app...');

  // ===== API Configuration =====
  const API_BASE = 'https://zrazl1az1c.execute-api.ap-northeast-2.amazonaws.com/dev/';

  // Wait for external libraries to be loaded
  console.log('⏳ Waiting for external libraries to load...');
  await Promise.all([
    new Promise((resolve) => {
      const checkLeaflet = () => {
        if (typeof L !== 'undefined') {
          console.log('✅ Leaflet library loaded');
          resolve();
        } else {
          setTimeout(checkLeaflet, 100);
        }
      };
      checkLeaflet();
    }),
    new Promise((resolve) => {
      const checkChart = () => {
        if (typeof Chart !== 'undefined') {
          console.log('✅ Chart.js library loaded');
          resolve();
        } else {
          setTimeout(checkChart, 100);
        }
      };
      checkChart();
    })
  ]);

  console.log('🎯 Starting app initialization...');

  // ===== Auth State =====
  let token = localStorage.getItem('token');
  let user = null;

  // ===== DOM =====
  const $ = (id, ...alts) =>
    document.getElementById(id) ||
    alts.map(x => document.getElementById(x)).find(Boolean) ||
    null;
  const setText = (el, value) => { if (el) el.textContent = value; };

  // Auth elements
  const authSection = $('authSection');
  const signupSection = $('signupSection');
  const userSection = $('userSection');
  const profileSection = $('profileSection');
  const userProfileSection = $('userProfileSection');

  // Profile page elements
  const viewProfileBtn = $('viewProfileBtn');
  const backToDashboardBtn = $('backToDashboardBtn');
  const tabOverview = $('tabOverview');
  const tabEditSurvey = $('tabEditSurvey');
  const overviewTab = $('overviewTab');
  const editSurveyTab = $('editSurveyTab');
  const saveEditedProfileBtn = $('saveEditedProfileBtn');
  const cancelEditBtn = $('cancelEditBtn');

  // Data elements
  const latInput = $('latInput');
  const lonInput = $('lonInput');

  // 버튼 id가 프로젝트마다 다를 수 있어 둘 다 지원
  const btnUseManual = $('btnUseManual', 'manualUseBtn');     // 수동 좌표 사용 버튼
  const btnReload    = $('btnReload', 'btnRefresh', 'reloadBtn'); // 다시 가져오기 버튼

  const elCity    = $('city');
  const elPm10    = $('pm10');
  const elPm25    = $('pm25');
  const elGrade   = $('grade');

  const elTemp    = $('temp');
  const elFeels   = $('feels');
  const elHumi    = $('humi');
  const elWind    = $('wind');
  const elRain    = $('rain');

  const elLat     = $('lat');
  const elLon     = $('lon');
  const elUpdated = $('updated');

  // ===== Auth Functions =====
  async function checkProfile() {
    if (!token) return false;
    try {
      const response = await fetch(API_BASE + 'api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const profile = await response.json();
        return !!profile;
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    }
    return false;
  }

  async function updateAuthUI() {
    if (token && user) {
      const hasProfile = await checkProfile();
      if (hasProfile) {
        if (authSection) authSection.style.display = 'none';
        if (signupSection) signupSection.style.display = 'none';
        if (profileSection) profileSection.style.display = 'none';
        if (userProfileSection) userProfileSection.style.display = 'none';
        if (userSection) userSection.style.display = 'block';
        // Automatically load and display profile
        await loadUserProfile();
      } else {
        if (authSection) authSection.style.display = 'none';
        if (signupSection) signupSection.style.display = 'none';
        if (userSection) userSection.style.display = 'none';
        if (userProfileSection) userProfileSection.style.display = 'none';
        if (profileSection) profileSection.style.display = 'block';
      }
    } else {
      if (authSection) authSection.style.display = 'block';
      if (signupSection) signupSection.style.display = 'none';
      if (userSection) userSection.style.display = 'none';
      if (profileSection) profileSection.style.display = 'none';
      if (userProfileSection) userProfileSection.style.display = 'none';
    }
  }

  // ===== Profile Page Functions =====
  async function loadUserProfile() {
    if (!token) return;
    try {
      const response = await fetch(API_BASE + 'api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const profile = await response.json();
        displayProfileData(profile);
        return profile;
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
    return null;
  }

  function displayProfileData(profile) {
    if (!profile) return;

    // Update user info
    setText($('profileUserName'), user.name);
    setText($('profileUserEmail'), user.email);

    // Update avatar based on gender
    const avatar = $('userAvatar');
    if (avatar) {
      if (profile.gender === 'male') {
        avatar.textContent = '👨';
      } else if (profile.gender === 'female') {
        avatar.textContent = '👩';
      } else {
        avatar.textContent = '👤';
      }
    }

    // Update user section display (when logged in)
    setText($('userNameDisplay'), user.name);
    setText($('userEmailDisplay'), user.email);

    const displayAvatar = $('userAvatarDisplay');
    if (displayAvatar) {
      if (profile.gender === 'male') {
        displayAvatar.textContent = '👨';
      } else if (profile.gender === 'female') {
        displayAvatar.textContent = '👩';
      } else {
        displayAvatar.textContent = '👤';
      }
    }

    // Update overview summary
    const ageGroupMap = {
      '0-6': '0–6세 (유아·영유아)',
      '7-12': '7–12세 (어린이)',
      '13-18': '13–18세 (청소년)',
      '19-64': '19–64세 (성인)',
      '65+': '65세 이상 (고령자)'
    };

    const genderMap = {
      'male': '남성',
      'female': '여성',
      'other': '기타 / 응답 안함'
    };

    setText($('summaryAgeGroup'), ageGroupMap[profile.ageGroup] || profile.ageGroup);
    setText($('summaryGender'), genderMap[profile.gender] || profile.gender);

    // Update user section display summary
    setText($('displayAgeGroup'), ageGroupMap[profile.ageGroup] || profile.ageGroup);
    setText($('displayGender'), genderMap[profile.gender] || profile.gender);

    // Chronic conditions
    const conditions = profile.chronicConditions || [];
    const conditionMap = {
      'asthma': '천식',
      'copd': 'COPD',
      'allergy': '알레르기',
      'heart': '심혈관 질환',
      'diabetes': '당뇨',
      'other': '기타',
      'none': '없음'
    };
    const conditionText = conditions.length > 0
      ? conditions.map(c => conditionMap[c] || c).join(', ')
      : '없음';
    setText($('summaryConditions'), conditionText);
    setText($('displayConditions'), conditionText);

    // Environmental sensitivity
    const sensitivityMap = {
      'very_sensitive': '매우 민감함',
      'sensitive': '민감함',
      'normal': '보통',
      'low': '둔함'
    };
    setText($('summarySensitivity'), sensitivityMap[profile.pmSensitivity] || '보통');
    setText($('displaySensitivity'), sensitivityMap[profile.pmSensitivity] || '보통');

    // Alert preferences
    const alertSituations = profile.alertSituations || [];
    const alertMap = {
      'pm10_bad': '미세먼지 나쁨',
      'pm25_bad': '초미세먼지 나쁨',
      'ozone_high': '오존 높음',
      'heatwave': '폭염',
      'coldwave': '한파',
      'temp_change': '온도 급변',
      'air_improvement': '공기질 개선',
      'personal_risk': '개인 건강 위험'
    };
    const alertText = alertSituations.length > 0
      ? alertSituations.map(a => alertMap[a] || a).join(', ')
      : '설정되지 않음';
    setText($('alertPreferences'), alertText);

    // Emergency contact
    const emergency = profile.emergencyContact || {};
    const emergencyText = emergency.enabled && emergency.name
      ? `${emergency.name} (${emergency.phone || '전화번호 미등록'})`
      : '설정되지 않음';
    setText($('emergencyInfo'), emergencyText);
  }

  function populateEditForm(profile) {
    if (!profile) return;

    // Basic info
    if ($('editAgeGroup')) $('editAgeGroup').value = profile.ageGroup || '';
    if ($('editGender')) $('editGender').value = profile.gender || '';

    // Chronic conditions
    const conditions = profile.chronicConditions || [];
    ['editAsthma', 'editCopd', 'editAllergy', 'editHeart', 'editDiabetes', 'editOther', 'editNone'].forEach(id => {
      const checkbox = $(id);
      if (checkbox) {
        const value = checkbox.value;
        checkbox.checked = conditions.includes(value);
      }
    });

    // Other sensitivities
    if ($('editRespiratorySensitivity')) $('editRespiratorySensitivity').value = profile.respiratorySensitivity || 'normal';
    if ($('editActivityTime')) $('editActivityTime').value = profile.activityTime || 'irregular';
    if ($('editOutdoorActivityHours')) $('editOutdoorActivityHours').value = profile.outdoorActivityHours || '1-3';
    if ($('editWorkEnvironment')) $('editWorkEnvironment').value = profile.workEnvironment || 'mixed';
    if ($('editPmSensitivity')) $('editPmSensitivity').value = profile.pmSensitivity || 'normal';
    if ($('editWeatherSensitivity')) $('editWeatherSensitivity').value = profile.weatherSensitivity || 'normal';
    if ($('editDisasterSensitivity')) $('editDisasterSensitivity').value = profile.disasterSensitivity || 'normal';
    if ($('editMaskUsage')) $('editMaskUsage').value = profile.maskUsage || 'sometimes';
    if ($('editAirPurifierUsage')) $('editAirPurifierUsage').value = profile.airPurifierUsage || 'rarely';

    // Alert situations
    const alertSituations = profile.alertSituations || [];
    ['editPm10Bad', 'editPm25Bad', 'editOzoneHigh', 'editHeatwave', 'editColdwave', 'editTempChange', 'editAirImprovement', 'editPersonalRisk'].forEach(id => {
      const checkbox = $(id);
      if (checkbox) {
        const value = checkbox.value;
        checkbox.checked = alertSituations.includes(value);
      }
    });

    if ($('editAlertTimePreference')) $('editAlertTimePreference').value = profile.alertTimePreference || 'anytime';

    // Emergency contact
    const emergency = profile.emergencyContact || {};
    if ($('editEmergencyEnabled')) $('editEmergencyEnabled').value = emergency.enabled ? 'true' : 'false';
    if ($('editEmergencyName')) $('editEmergencyName').value = emergency.name || '';
    if ($('editEmergencyPhone')) $('editEmergencyPhone').value = emergency.phone || '';

    // Toggle emergency details visibility
    const emergencyDetails = $('editEmergencyDetails');
    if (emergencyDetails) {
      emergencyDetails.style.display = emergency.enabled ? 'block' : 'none';
    }
  }

  function switchTab(tabName) {
    // Update tab buttons
    if (tabOverview) tabOverview.classList.toggle('active', tabName === 'overview');
    if (tabEditSurvey) tabEditSurvey.classList.toggle('active', tabName === 'edit');

    // Update tab content
    if (overviewTab) overviewTab.classList.toggle('active', tabName === 'overview');
    if (editSurveyTab) editSurveyTab.classList.toggle('active', tabName === 'edit');
  }

  // ===== Seoul Districts Map =====
  let seoulMap = null;
  let districtLayerGroup = null;
  let currentLocationMarker = null;

  function getAirQualityColor(pm10, pm25) {
    const avg = (pm10 + pm25) / 2;
    if (avg <= 30) return '#00d4aa'; // Good - green
    if (avg <= 80) return '#ffd700'; // Moderate - yellow
    return '#ff6b6b'; // Bad - red
  }

  function getAirQualityGrade(pm10, pm25) {
    const avg = (pm10 + pm25) / 2;
    if (avg <= 30) return '좋음';
    if (avg <= 80) return '보통';
    return '나쁨';
  }

  async function loadSeoulDistrictsMap() {
    console.log('🗺️ Starting to load Seoul districts map...');
    const mapContainer = $('seoulMap');
    if (!mapContainer) {
      console.error('❌ Map container not found');
      return;
    }
    console.log('✅ Map container found');

    try {
      console.log('📡 Fetching districts data...');
      // Fetch districts data
      const response = await fetch(API_BASE + 'api/air/districts');
      console.log('📡 Districts response status:', response.status);
      const data = await response.json();
      console.log('📡 Districts data received:', data);

      if (!data.districts || data.districts.length === 0) {
        console.warn('⚠️ No districts data available');
        // Show a simple message instead of error
        mapContainer.innerHTML = '<p style="text-align: center; color: #94a3b8; padding: 20px;">지구별 공기질 데이터를 불러오는 중입니다...</p>';
        return;
      }
      console.log('✅ Found', data.districts.length, 'districts');

      // Initialize map centered on Seoul
      console.log('🗺️ Initializing map...');
      if (!seoulMap) {
        seoulMap = L.map('seoulMap').setView([37.5665, 126.9780], 11);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(seoulMap);
        console.log('✅ Map initialized');
      }

      // Clear existing layers
      if (districtLayerGroup) {
        seoulMap.removeLayer(districtLayerGroup);
      }
      if (currentLocationMarker) {
        seoulMap.removeLayer(currentLocationMarker);
      }

      // Use FeatureGroup so we can compute bounds across child layers
      districtLayerGroup = L.featureGroup().addTo(seoulMap);
      currentLocationMarker = null;

      console.log('📡 Fetching GeoJSON data...');
      // Load GeoJSON data
      const geoJsonResponse = await fetch('/seoul_districts.geojson');
      console.log('📡 GeoJSON response status:', geoJsonResponse.status);
      const geoJsonData = await geoJsonResponse.json();
      console.log('📡 GeoJSON data received, features count:', geoJsonData.features?.length);

      // Create a lookup map for district data
      const districtDataMap = {};
      data.districts.forEach(district => {
        // Normalize district names by removing spaces
        const normalizedName = district.district.replace(/\s+/g, '');
        districtDataMap[normalizedName] = district;
      });
      console.log('📊 District data map created with', Object.keys(districtDataMap).length, 'entries');

      // Frontend fallback: synthesize data for any missing districts using GeoJSON + averages
      try {
        const existing = data.districts || [];
        const validPm10 = existing.map(d => d.pm10).filter(v => Number.isFinite(v));
        const validPm25 = existing.map(d => d.pm25).filter(v => Number.isFinite(v));
        const defaultPm10 = validPm10.length ? Math.round(validPm10.reduce((a,b)=>a+b,0)/validPm10.length) : 30;
        const defaultPm25 = validPm25.length ? Math.round(validPm25.reduce((a,b)=>a+b,0)/validPm25.length) : 15;

        const features = Array.isArray(geoJsonData.features) ? geoJsonData.features : [];
        let added = 0;
        features.forEach(f => {
          const n = (f?.properties?.name || '').replace(/\s+/g,'');
          if (n && !districtDataMap[n]) {
            // small variation ±15%
            const vary = 0.15;
            const pm10 = Math.max(0, Math.round(defaultPm10 * (1 + (Math.random() - 0.5) * vary)));
            const pm25 = Math.max(0, Math.round(defaultPm25 * (1 + (Math.random() - 0.5) * vary)));
            districtDataMap[n] = {
              district: f.properties.name,
              pm10,
              pm25,
              grade: getAirQualityGrade(pm10, pm25),
              time: data.updated || new Date().toISOString(),
              simulated: true
            };
            added++;
          }
        });
        if (added) console.log(`🧩 Filled ${added} missing districts on client (fallback)`);
      } catch (e) {
        console.warn('Fallback synthesis failed:', e);
      }

      console.log('🎨 Adding district polygons...');
      // Add district polygons
      const geoJsonLayer = L.geoJSON(geoJsonData, {
        style: function(feature) {
          const districtName = feature.properties.name;
          const normalizedName = districtName.replace(/\s+/g, '');
          const districtData = districtDataMap[normalizedName];
          
          let fillColor = '#cccccc'; // Default gray for no data
          if (districtData) {
            const pm10 = districtData.pm10 || 0;
            const pm25 = districtData.pm25 || 0;
            const avg = (pm10 + pm25) / 2;
            
            if (avg <= 30) {
              fillColor = '#00d4aa'; // Good - green
            } else if (avg <= 80) {
              fillColor = '#ffd700'; // Moderate - yellow
            } else {
              fillColor = '#ff6b6b'; // Bad - red
            }
          }

          return {
            fillColor: fillColor,
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
          };
        },
        onEachFeature: function(feature, layer) {
          const districtName = feature.properties.name;
          const normalizedName = districtName.replace(/\s+/g, '');
          const districtData = districtDataMap[normalizedName];

          let popupContent = `
            <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; color: #1e293b; font-size: 16px;">${districtName}</h4>
          `;

          if (districtData) {
            const color = getAirQualityColor(districtData.pm10 || 0, districtData.pm25 || 0);
            const grade = getAirQualityGrade(districtData.pm10 || 0, districtData.pm25 || 0);
            
            popupContent += `
              <div style="display: grid; gap: 4px; font-size: 14px;">
                <div>미세먼지 (PM10): <strong>${districtData.pm10 || '-'} μg/m³</strong></div>
                <div>초미세먼지 (PM2.5): <strong>${districtData.pm25 || '-'} μg/m³</strong></div>
                <div>대기질 등급: <strong style="color: ${color};">${grade}</strong></div>
                <div style="margin-top: 4px; font-size: 12px; color: #64748b;">
                  업데이트: ${districtData.time ? new Date(districtData.time).toLocaleString('ko-KR') : '정보 없음'}
                </div>
                ${districtData.simulated ? '<div style="margin-top:4px;font-size:12px;color:#94a3b8;">(참고: 평균 기반 추정값)</div>' : ''}
              </div>
            `;
          } else {
            popupContent += `
              <div style="font-size: 14px; color: #64748b;">
                대기질 데이터가 아직 수집되지 않았습니다.
              </div>
            `;
          }

          popupContent += `</div>`;
          layer.bindPopup(popupContent);

          // Add hover effects
          layer.on('mouseover', function(e) {
            const layer = e.target;
            layer.setStyle({
              weight: 3,
              color: '#666',
              dashArray: '',
              fillOpacity: 0.9
            });
            layer.bringToFront();
          });

          layer.on('mouseout', function(e) {
            const layer = e.target;
            layer.setStyle({
              weight: 2,
              color: 'white',
              dashArray: '3',
              fillOpacity: 0.7
            });
          });
        }
      }).addTo(districtLayerGroup);

      console.log('🎯 Adding current location marker...');
      // Add current location marker with red flag
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            // Create red flag marker
            const flagIcon = L.divIcon({
              className: 'current-location-flag',
              html: `<div style="
                background: #ff0000;
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 12px;
                font-weight: bold;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                border: 2px solid white;
              ">📍 현재 위치</div>`,
              iconSize: [80, 20],
              iconAnchor: [40, 20]
            });

            currentLocationMarker = L.marker([lat, lon], { icon: flagIcon }).addTo(seoulMap);
            
            // Add popup to current location marker
            currentLocationMarker.bindPopup(`
              <div style="font-family: system-ui, -apple-system, sans-serif;">
                <h4 style="margin: 0 0 8px 0; color: #1e293b;">📍 현재 위치</h4>
                <div style="font-size: 14px;">
                  위도: ${lat.toFixed(4)}<br>
                  경도: ${lon.toFixed(4)}
                </div>
              </div>
            `);
            console.log('✅ Current location marker added');
          },
          function(error) {
            console.log('⚠️ Geolocation error:', error);
            // Don't show error to user, just skip the marker
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      }

      console.log('🎯 Fitting map to bounds...');
      // Fit map to show all districts
      if (districtLayerGroup.getLayers().length > 0) {
        // FeatureGroup supports getBounds; fallback to geoJson layer if needed
        const bounds = (typeof districtLayerGroup.getBounds === 'function')
          ? districtLayerGroup.getBounds()
          : geoJsonLayer.getBounds();
        seoulMap.fitBounds(bounds.pad(0.05));
        console.log('✅ Map fitted to bounds');
      }

      console.log('🎉 Seoul districts map loaded successfully!');

    } catch (error) {
      console.error('❌ Error loading Seoul districts map:', error);
      if (mapContainer) {
        mapContainer.innerHTML = '<p style="text-align: center; color: #94a3b8; padding: 20px;">지도 데이터를 불러올 수 없습니다.</p>';
      }
    }
  }

  // ===== Chart Initialization =====
  let historyChart = null;
  const canvas = $('historyChart');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Create gradient backgrounds
      const pm10Gradient = ctx.createLinearGradient(0, 0, 0, 400);
      pm10Gradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
      pm10Gradient.addColorStop(1, 'rgba(239, 68, 68, 0.05)');

      const pm25Gradient = ctx.createLinearGradient(0, 0, 0, 400);
      pm25Gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
      pm25Gradient.addColorStop(1, 'rgba(99, 102, 241, 0.05)');

      historyChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: '미세먼지 (PM10)',
            data: [],
            borderColor: '#ef4444',
            backgroundColor: pm10Gradient,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: '#ef4444',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 3,
            shadowColor: 'rgba(239, 68, 68, 0.3)',
            shadowBlur: 10
          }, {
            label: '초미세먼지 (PM2.5)',
            data: [],
            borderColor: '#6366f1',
            backgroundColor: pm25Gradient,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#6366f1',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: '#6366f1',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 3,
            shadowColor: 'rgba(99, 102, 241, 0.3)',
            shadowBlur: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                  size: 12,
                  weight: '600',
                  family: 'system-ui, -apple-system, sans-serif'
                },
                color: '#ffffff'
              }
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              titleColor: '#ffffff',
              bodyColor: '#e2e8f0',
              borderColor: 'var(--border)',
              borderWidth: 1,
              cornerRadius: 12,
              displayColors: true,
              padding: 12,
              titleFont: {
                size: 14,
                weight: '600'
              },
              bodyFont: {
                size: 13
              },
              callbacks: {
                title: function(context) {
                  return '시간: ' + context[0].label;
                },
                label: function(context) {
                  return context.dataset.label + ': ' + context.parsed.y + ' μg/m³';
                }
              }
            }
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: '시간',
                font: {
                  size: 14,
                  weight: '600'
                },
                color: '#e2e8f0'
              },
              grid: {
                color: 'rgba(148, 163, 184, 0.1)',
                borderColor: 'var(--border)'
              },
              ticks: {
                color: '#cbd5e1',
                font: {
                  size: 11
                },
                maxTicksLimit: 8
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: '농도 (μg/m³)',
                font: {
                  size: 14,
                  weight: '600'
                },
                color: '#e2e8f0'
              },
              grid: {
                color: 'rgba(148, 163, 184, 0.1)',
                borderColor: 'var(--border)'
              },
              ticks: {
                color: '#cbd5e1',
                font: {
                  size: 11
                },
                callback: function(value) {
                  return value + ' μg/m³';
                }
              },
              beginAtZero: true
            }
          },
          elements: {
            point: {
              hoverBorderWidth: 3
            }
          },
          animation: {
            duration: 2000,
            easing: 'easeInOutQuart'
          }
        },
        plugins: [{
          id: 'customCanvasBackgroundColor',
          beforeDraw: (chart, args, options) => {
            const {ctx} = chart;
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = 'rgba(15, 23, 42, 0.02)';
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
          }
        }]
      });
    }
  }

  function setLoading(on) {
    [elCity, elPm10, elPm25, elGrade, elTemp, elFeels, elHumi, elWind, elRain].forEach(n => {
      if (on && n) n.textContent = '데이터 로딩 중...';
    });
  }

  // ---------- 더 견고한 날씨 필드 매핑 ----------
  function updateWeather(w) {
    // 온도
    const temp = w?.temperature;

    // 체감온도
    const feels = w?.feelsLike;

    // 습도
    const humi = w?.humidity;

    // 풍속
    const wind = w?.wind;

    // 강수확률
    const precip = w?.precipitationProbability;

    // 표시 (단위 포함)
    setText(elTemp,  temp  != null ? `${temp}°` : '-');
    setText(elFeels, feels != null ? `${feels}°` : '-');
    setText(elHumi,  humi  != null ? `${humi}%` : '-');
    setText(elWind,  wind  != null ? `${wind} m/s` : '-');
    setText(elRain,  precip != null ? `${precip}%` : '-');
  }

  // ---------- 더 견고한 공기질 필드 매핑 ----------
  function updateAir(aq) {
    // 행정구역/도시
    const city = aq?.city;

    // PM10/PM2.5 값
    const pm10 = aq?.pm10;
    const pm25 = aq?.pm25;

    // 등급/설명
    const grade = aq?.grade;

    setText(elCity,  city  ?? '-');
    setText(elPm10,  pm10  != null ? `${pm10} µg/m³` : '-');
    setText(elPm25,  pm25  != null ? `${pm25} µg/m³` : '-');
    setText(elGrade, grade ?? '-');
  }

  // ---------- 건강 알림 표시 ----------
  function updateAlert(al) {
    console.log('🔔 updateAlert called with:', al);
    const alertElement = $('alertMessage');
    const severityElement = $('alertSeverity');
    const badgeElement = $('severityBadge');
    
    console.log('🔔 alertElement found:', !!alertElement);
    
    if (alertElement && al && al.alert) {
      // Remove loading class and update content
      alertElement.innerHTML = `<p>${al.alert}</p>`;
      alertElement.classList.remove('loading');
      
      console.log('🔔 Alert displayed:', al.alert);
      
      // Show severity badge if available
      if (severityElement && badgeElement && al.severity) {
        let badgeClass = 'badge-success';
        let severityText = '낮음';
        
        if (al.severity === 'high') {
          badgeClass = 'badge-danger';
          severityText = '높음';
        } else if (al.severity === 'medium') {
          badgeClass = 'badge-warning';
          severityText = '중간';
        }
        
        badgeElement.className = `badge ${badgeClass}`;
        badgeElement.textContent = `위험도: ${severityText}`;
        severityElement.style.display = 'block';
        
        console.log('🔔 Severity badge shown:', al.severity);
      } else if (severityElement) {
        severityElement.style.display = 'none';
      }
    } else if (alertElement) {
      alertElement.innerHTML = '<p>알림 정보를 불러올 수 없습니다.</p>';
      alertElement.classList.remove('loading');
      if (severityElement) severityElement.style.display = 'none';
      
      console.log('🔔 Alert display failed - no alert data or element not found');
    } else {
      console.log('🔔 Alert element not found in DOM');
    }
  }

  async function updateChart() {
    if (!historyChart) return;
    try {
      const response = await fetch(API_BASE + 'api/history/raw?hours=12');
      const data = await response.json();

      const chartNote = $('chartNote');
      if (data.length === 0) {
        if (chartNote) chartNote.style.display = 'block';
        historyChart.data.labels = [];
        historyChart.data.datasets[0].data = [];
        historyChart.data.datasets[1].data = [];
        historyChart.update();

        // Clear stats
        setText($('avgPm10'), '-');
        setText($('avgPm25'), '-');
        setText($('maxPm10'), '-');
        setText($('maxPm25'), '-');
        return;
      }
      if (chartNote) chartNote.style.display = 'none';

      const labels = data.map(d => {
        const date = new Date(d.timestamp);
        return date.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      });
      const pm10Data = data.map(d => d.pm10 || 0);
      const pm25Data = data.map(d => d.pm25 || 0);

      historyChart.data.labels = labels;
      historyChart.data.datasets[0].data = pm10Data;
      historyChart.data.datasets[1].data = pm25Data;
      historyChart.update();

      // Calculate and display statistics
      const validPm10 = pm10Data.filter(v => v > 0);
      const validPm25 = pm25Data.filter(v => v > 0);

      if (validPm10.length > 0) {
        const avgPm10 = (validPm10.reduce((a, b) => a + b, 0) / validPm10.length).toFixed(1);
        const maxPm10 = Math.max(...validPm10);
        setText($('avgPm10'), avgPm10);
        setText($('maxPm10'), maxPm10);
      } else {
        setText($('avgPm10'), '-');
        setText($('maxPm10'), '-');
      }

      if (validPm25.length > 0) {
        const avgPm25 = (validPm25.reduce((a, b) => a + b, 0) / validPm25.length).toFixed(1);
        const maxPm25 = Math.max(...validPm25);
        setText($('avgPm25'), avgPm25);
        setText($('maxPm25'), maxPm25);
      } else {
        setText($('avgPm25'), '-');
        setText($('maxPm25'), '-');
      }
    } catch (error) {
      console.error('Error updating chart:', error);
    }
  }

  async function fetchAll(lat, lon) {
    const qs = `lat=${lat}&lon=${lon}`;
    setLoading(true);
    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const alertEndpoint = token ? 'api/alert/personal' : 'api/alert';
      const [wRes, aRes, alRes] = await Promise.all([
        fetch(API_BASE + `api/weather?${qs}`),
        fetch(API_BASE + `api/air?${qs}`),
        fetch(API_BASE + `${alertEndpoint}?${qs}`, { headers })
      ]);

      const [w, a] = await Promise.all([wRes.json(), aRes.json()]);
      
      // Handle alert response - if personal endpoint fails with 401, try general endpoint
      let al;
      if (alRes.status === 401 && alertEndpoint === 'api/alert/personal') {
        console.log('Personal alert failed with 401, trying general alert endpoint');
        const generalAlRes = await fetch(API_BASE + `api/alert?${qs}`);
        al = await generalAlRes.json();
        // Clear invalid token
        token = null;
        localStorage.removeItem('token');
        updateAuthUI();
      } else {
        al = await alRes.json();
      }

      updateWeather(w);
      updateAir(a);
      console.log('📡 Calling updateAlert with alert data:', al);
      updateAlert(al);

      setText(elLat,     (lat?.toFixed ? lat.toFixed(4) : lat) ?? '-');
      setText(elLon,     (lon?.toFixed ? lon.toFixed(4) : lon) ?? '-');
      setText(elUpdated, new Date().toLocaleString());
    } catch (e) {
      console.error(e);
      alert('데이터 요청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      updateChart();
    }
  }

  // ===== Auth Event Listeners =====
  if ($('loginBtn')) {
    $('loginBtn').addEventListener('click', async () => {
      const email = $('loginEmail').value;
      const password = $('loginPassword').value;

      try {
        const response = await fetch(API_BASE + 'api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
          token = data.token;
          user = data.user;
          localStorage.setItem('token', token);
          updateAuthUI();
          fetchAll(); // Refresh data
        } else {
          alert(data.error);
        }
      } catch (error) {
        alert('Login failed');
      }
    });
  }

  if ($('signupBtn')) {
    $('signupBtn').addEventListener('click', async () => {
      const email = $('signupEmail').value;
      const name = $('signupName').value;
      const password = $('signupPassword').value;

      try {
        const response = await fetch(API_BASE + 'api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name })
        });
        const data = await response.json();
        if (response.ok) {
          alert('Signup successful! Please login.');
          if ($('showLoginBtn')) $('showLoginBtn').click();
        } else {
          alert(data.error);
        }
      } catch (error) {
        alert('Signup failed');
      }
    });
  }

  if ($('showSignupBtn')) {
    $('showSignupBtn').addEventListener('click', () => {
      if (authSection) authSection.style.display = 'none';
      if (signupSection) signupSection.style.display = 'block';
    });
  }

  if ($('showLoginBtn')) {
    $('showLoginBtn').addEventListener('click', () => {
      if (signupSection) signupSection.style.display = 'none';
      if (authSection) authSection.style.display = 'block';
    });
  }

  if ($('logoutBtn')) {
    $('logoutBtn').addEventListener('click', () => {
      token = null;
      user = null;
      localStorage.removeItem('token');
      updateAuthUI();
    });
  }

  // Profile page event listeners
  if (viewProfileBtn) {
    viewProfileBtn.addEventListener('click', async () => {
      const profile = await loadUserProfile();
      if (profile) {
        if (userSection) userSection.style.display = 'none';
        if (userProfileSection) userProfileSection.style.display = 'block';
        switchTab('overview');
      }
    });
  }

  // Edit profile button (opens full profile editor)
  if ($('editProfileBtn')) {
    $('editProfileBtn').addEventListener('click', async () => {
      const profile = await loadUserProfile();
      if (profile) {
        if (userSection) userSection.style.display = 'none';
        if (userProfileSection) userProfileSection.style.display = 'block';
        switchTab('edit');
      }
    });
  }

  if (backToDashboardBtn) {
    backToDashboardBtn.addEventListener('click', () => {
      if (userProfileSection) userProfileSection.style.display = 'none';
      if (userSection) userSection.style.display = 'block';
    });
  }

  if (tabOverview) {
    tabOverview.addEventListener('click', () => switchTab('overview'));
  }

  if (tabEditSurvey) {
    tabEditSurvey.addEventListener('click', async () => {
      const profile = await loadUserProfile();
      populateEditForm(profile);
      switchTab('edit');
    });
  }

  if (saveEditedProfileBtn) {
    saveEditedProfileBtn.addEventListener('click', async () => {
      const ageGroup = $('editAgeGroup').value;
      const gender = $('editGender').value;

      if (!ageGroup || !gender) {
        alert('연령대와 성별을 선택해주세요.');
        return;
      }

      // Collect chronic conditions
      const chronicValues = ['asthma', 'copd', 'allergy', 'heart', 'diabetes', 'other', 'none'];
      const chronicConditions = chronicValues
        .map(value => document.querySelector(`input[value="${value}"]`))
        .filter(cb => cb && cb.checked)
        .map(cb => cb.value);

      // Collect alert situations
      const alertSituations = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
        .filter(cb => !chronicValues.includes(cb.value))
        .map(cb => cb.value);

      const profileData = {
        ageGroup,
        gender,
        chronicConditions,
        respiratorySensitivity: $('editRespiratorySensitivity').value,
        activityTime: $('editActivityTime').value,
        outdoorActivityHours: $('editOutdoorActivityHours').value,
        workEnvironment: $('editWorkEnvironment').value,
        pmSensitivity: $('editPmSensitivity').value,
        weatherSensitivity: $('editWeatherSensitivity').value,
        disasterSensitivity: $('editDisasterSensitivity').value,
        maskUsage: $('editMaskUsage').value,
        airPurifierUsage: $('editAirPurifierUsage').value,
        alertSituations,
        alertTimePreference: $('editAlertTimePreference').value,
        emergencyContact: {
          enabled: $('editEmergencyEnabled').value === 'true',
          name: $('editEmergencyName')?.value || '',
          phone: $('editEmergencyPhone')?.value || ''
        }
      };

      try {
        const response = await fetch(API_BASE + 'api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(profileData)
        });

        if (response.ok) {
          alert('프로필이 성공적으로 수정되었습니다!');
          await loadUserProfile(); // Refresh the overview
          switchTab('overview');
        } else {
          let errorMessage = '프로필 수정 실패';
          try {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          } catch (e) {
            errorMessage = `서버 오류 (${response.status}): ${response.statusText}`;
          }
          alert(errorMessage);
        }
      } catch (error) {
        console.error('Profile update error:', error);
        alert('프로필 수정 중 오류 발생: ' + error.message);
      }
    });
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
      switchTab('overview');
    });
  }

  // Emergency contact toggle for edit form
  if ($('editEmergencyEnabled')) {
    $('editEmergencyEnabled').addEventListener('change', (e) => {
      const details = $('editEmergencyDetails');
      if (details) {
        details.style.display = e.target.value === 'true' ? 'block' : 'none';
      }
    });
  }

  // Profile event listeners
  if ($('saveProfileBtn')) {
    $('saveProfileBtn').addEventListener('click', async () => {
      const ageGroup = $('ageGroup').value;
      const gender = $('gender').value;

      if (!ageGroup || !gender) {
        alert('연령대와 성별을 선택해주세요.');
        return;
      }

      // Collect chronic conditions - use specific known values
      const chronicValues = ['asthma', 'copd', 'allergy', 'heart', 'diabetes', 'other', 'none'];
      const chronicConditions = chronicValues
        .map(value => document.querySelector(`#profileSection input[value="${value}"]`))
        .filter(cb => cb && cb.checked)
        .map(cb => cb.value);

      const profileData = {
        ageGroup,
        gender,
        chronicConditions,
        respiratorySensitivity: $('respiratorySensitivity').value,
        activityTime: $('activityTime').value,
        outdoorActivityHours: $('outdoorActivityHours').value,
        workEnvironment: $('workEnvironment').value,
        pmSensitivity: $('pmSensitivity').value,
        weatherSensitivity: $('weatherSensitivity').value,
        disasterSensitivity: $('disasterSensitivity').value,
        maskUsage: $('maskUsage').value,
        airPurifierUsage: $('airPurifierUsage').value,
        alertSituations: Array.from(document.querySelectorAll('#profileSection input[type="checkbox"]:checked'))
          .filter(cb => !chronicValues.includes(cb.value))
          .map(cb => cb.value),
        alertTimePreference: $('alertTimePreference').value,
        emergencyContact: {
          enabled: $('emergencyEnabled').value === 'true',
          name: $('emergencyName')?.value || '',
          phone: $('emergencyPhone')?.value || ''
        }
      };

      try {
        const response = await fetch(API_BASE + 'api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(profileData)
        });

        if (response.ok) {
          alert('프로필이 저장되었습니다!');
          updateAuthUI();
        } else {
          let errorMessage = '프로필 저장 실패';
          try {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          } catch (e) {
            errorMessage = `서버 오류 (${response.status}): ${response.statusText}`;
          }
          alert(errorMessage);
        }
      } catch (error) {
        console.error('Profile save error:', error);
        alert('프로필 저장 중 오류 발생: ' + error.message);
      }
    });
  }

  // Emergency contact toggle
  if ($('emergencyEnabled')) {
    $('emergencyEnabled').addEventListener('change', (e) => {
      const details = $('emergencyDetails');
      if (details) {
        details.style.display = e.target.value === 'true' ? 'block' : 'none';
      }
    });
  }

  if ($('skipProfileBtn')) {
    $('skipProfileBtn').addEventListener('click', () => {
      updateAuthUI(); // Skip to user section
    });
  }

  // ===== 수동 좌표 사용 =====
  if (btnUseManual) {
    btnUseManual.addEventListener('click', () => {
      if (!latInput || !lonInput) {
        alert('입력창을 찾을 수 없습니다.');
        return;
      }
      const lat = parseFloat(latInput.value);
      const lon = parseFloat(lonInput.value);
      if (Number.isNaN(lat) || Number.isNaN(lon)) {
        alert('위도/경도를 숫자로 입력하세요.');
        return;
      }
      fetchAll(lat, lon);
    });
  } else {
    console.warn('수동 좌표 버튼(btnUseManual/manualUseBtn)을 찾지 못했습니다.');
  }

  // ===== 브라우저 권한으로 재시도 =====
  if (btnReload) {
    btnReload.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('브라우저가 위치 권한을 지원하지 않습니다.');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          if (latInput) latInput.value = lat;
          if (lonInput) lonInput.value = lon;
          fetchAll(lat, lon);
        },
        err => {
          console.warn(err);
          alert('위치 권한을 사용할 수 없습니다. 수동 좌표를 입력하세요.');
        }
      );
    });
  } else {
    console.warn('새로고침 버튼(btnReload/btnRefresh/reloadBtn)을 찾지 못했습니다.');
  }

  // ===== Initialize =====
  updateAuthUI();

  // Load Seoul districts map directly
  loadSeoulDistrictsMap();

  // Use default Seoul coordinates for immediate data loading
  const defaultLat = 37.5665;
  const defaultLon = 126.9780;
  if (latInput) latInput.value = defaultLat;
  if (lonInput) lonInput.value = defaultLon;
  fetchAll(defaultLat, defaultLon);
});
