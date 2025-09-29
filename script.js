// Variáveis globais
let map;
let userMarker;
let userPosition;
let placesService;
let markers = [];

// Inicializar o mapa quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    // Configurar o botão de obter localização
    document.getElementById('get-location').addEventListener('click', getUserLocation);
    
    // Configurar os botões de filtro
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        // Desabilitar botões inicialmente até que a localização seja obtida
        button.disabled = true;
        
        button.addEventListener('click', () => {
            // Remover classe ativa de todos os botões
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Adicionar classe ativa ao botão clicado
            button.classList.add('active');
            
            // Buscar locais próximos com base no tipo selecionado
            if (userPosition) {
                const placeType = button.getAttribute('data-type');
                searchNearbyPlaces(placeType);
            } else {
                updateLocationStatus('Por favor, compartilhe sua localização primeiro.');
            }
        });
    });
    
    // Inicializar o mapa com uma localização padrão (Brasil)
    initMap({ lat: -15.77972, lng: -47.92972 });
    
    // Verificar se já temos permissão de geolocalização e obter automaticamente
    if (navigator.permissions) {
        navigator.permissions.query({name:'geolocation'}).then(function(result) {
            if (result.state === 'granted') {
                // Se já temos permissão, obter localização automaticamente
                getUserLocation();
            }
        });
    }
    
    // Funcionalidade do botão de emergência
    const emergencyButton = document.getElementById('emergencyButton');
    const emergencyPopup = document.getElementById('emergencyPopup');
    const closePopup = document.getElementById('closePopup');
    
    if (emergencyButton && emergencyPopup && closePopup) {
        // Garantir que o popup esteja inicialmente oculto
        emergencyPopup.style.display = 'none';
        
        emergencyButton.addEventListener('click', function(e) {
            e.stopPropagation(); // Impedir propagação do evento
            emergencyPopup.style.display = emergencyPopup.style.display === 'block' ? 'none' : 'block';
        });
        
        closePopup.addEventListener('click', function() {
            emergencyPopup.style.display = 'none';
        });
        
        // Adicionar eventos aos links de telefone
        const emergencyCalls = document.querySelectorAll('.emergency-call');
        emergencyCalls.forEach(call => {
            call.addEventListener('click', function(e) {
                // Permitir que o navegador abra o discador telefônico
                console.log('Ligando para: ' + this.getAttribute('href').replace('tel:', ''));
            });
        });
        
        // Fechar o popup se clicar fora dele, mas não se clicar em um link
        document.addEventListener('click', function(event) {
            if (!emergencyPopup.contains(event.target) && event.target !== emergencyButton) {
                emergencyPopup.style.display = 'none';
            }
        });
    }
});

// Inicializar o mapa do Google Maps
function initMap(center) {
    try {
        map = new google.maps.Map(document.getElementById('map'), {
            center: center,
            zoom: 14,
            styles: [
                {
                    featureType: 'poi.school',
                    stylers: [{ visibility: 'on' }]
                }
            ]
        });
        
        // Inicializar o serviço de Places
        placesService = new google.maps.places.PlacesService(map);
        
        // Adicionar listener para erros da API
        window.gm_authFailure = function() {
            alert('Erro na autenticação da API do Google Maps. Verifique sua chave de API.');
            document.getElementById('map').innerHTML = '<div style="text-align:center; padding:20px; color:red;">Erro na API do Google Maps. Verifique sua chave de API.</div>';
        };
    } catch (error) {
        console.error('Erro ao inicializar o mapa:', error);
        document.getElementById('map').innerHTML = '<div style="text-align:center; padding:20px; color:red;">Erro ao carregar o mapa. Tente novamente mais tarde.</div>';
    }
}

// Obter a localização do usuário
function getUserLocation() {
    updateLocationStatus('Obtendo sua localização...');
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Centralizar o mapa na posição do usuário
                map.setCenter(userPosition);
                map.setZoom(15);
                
                // Adicionar marcador para a posição do usuário
                if (userMarker) {
                    userMarker.setPosition(userPosition);
                } else {
                    userMarker = new google.maps.Marker({
                        position: userPosition,
                        map: map,
                        title: 'Sua localização',
                        icon: {
                            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                        }
                    });
                }
                
                updateLocationStatus('Localização obtida com sucesso! Agora selecione uma categoria para buscar locais próximos.');
                
                // Ativar os botões de filtro
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.disabled = false;
                });
            },
            (error) => {
                let errorMessage;
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Acesso à localização negado pelo usuário.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Informações de localização indisponíveis.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Tempo esgotado ao obter localização.';
                        break;
                    default:
                        errorMessage = 'Erro desconhecido ao obter localização.';
                }
                updateLocationStatus(errorMessage);
            }
        );
    } else {
        updateLocationStatus('Geolocalização não é suportada pelo seu navegador.');
    }
}

// Atualizar o status da localização
function updateLocationStatus(message) {
    document.getElementById('location-status').textContent = message;
}

// Buscar locais próximos com base no tipo
function searchNearbyPlaces(type) {
    // Limpar marcadores anteriores
    clearMarkers();
    
    // Limpar lista de resultados
    const placesList = document.getElementById('places-results');
    placesList.innerHTML = '';
    
    // Mapear os tipos de locais para os tipos corretos da API do Google
     const typeMapping = {
         'hospital': ['hospital', 'health'],
         'farmacia': ['pharmacy', 'drugstore'],
         'upa': ['hospital', 'health', 'doctor', 'emergency_room'],
         'prontosocorro': ['hospital', 'emergency_room', 'health'],
         'delegacia': ['police', 'local_government_office']
     };
    
    // Usar o tipo mapeado ou o tipo original se não houver mapeamento
    const searchTypes = typeMapping[type] || [type];
    
    // Configurar a solicitação de busca com um raio maior
    const request = {
        location: userPosition,
        radius: 5000, // 5km para encontrar mais resultados
        keyword: type, // Adicionar palavra-chave para melhorar os resultados
        type: searchTypes[0] // Usar o primeiro tipo mapeado
    };
    
    // Exibir mensagem de carregamento
    placesList.innerHTML = '<li>Buscando locais próximos...</li>';
    
    // Realizar a busca
    placesService.nearbySearch(request, (results, status) => {
        // Limpar a mensagem de carregamento
        placesList.innerHTML = '';
        
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
            console.log(`Encontrados ${results.length} resultados para ${type}`);
            
            // Adicionar cada local encontrado ao mapa e à lista
            results.forEach((place, index) => {
                if (index < 15) { // Aumentar o limite para 15 resultados
                    createMarker(place);
                    addPlaceToList(place);
                }
            });
        } else {
            console.error(`Erro na busca: ${status}`);
            
            // Tentar novamente com outro tipo se houver mais tipos mapeados
            if (searchTypes.length > 1) {
                const newRequest = {
                    location: userPosition,
                    radius: 5000,
                    keyword: type,
                    type: searchTypes[1]
                };
                
                placesService.nearbySearch(newRequest, (secondResults, secondStatus) => {
                    if (secondStatus === google.maps.places.PlacesServiceStatus.OK && secondResults && secondResults.length > 0) {
                        console.log(`Encontrados ${secondResults.length} resultados na segunda tentativa`);
                        
                        secondResults.forEach((place, index) => {
                            if (index < 15) {
                                createMarker(place);
                                addPlaceToList(place);
                            }
                        });
                    } else {
                        placesList.innerHTML = '<li>Nenhum local encontrado nas proximidades. Tente aumentar o zoom do mapa ou selecionar outra categoria.</li>';
                    }
                });
            } else {
                placesList.innerHTML = '<li>Nenhum local encontrado nas proximidades. Tente aumentar o zoom do mapa ou selecionar outra categoria.</li>';
            }
        }
    });
}

// Criar um marcador para um local
function createMarker(place) {
    const marker = new google.maps.Marker({
        position: place.geometry.location,
        map: map,
        title: place.name,
        animation: google.maps.Animation.DROP
    });
    
    // Adicionar janela de informações ao clicar no marcador
    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div>
                <h3>${place.name}</h3>
                <p>${place.vicinity}</p>
                ${place.rating ? `<p>Avaliação: ${place.rating} ⭐</p>` : ''}
            </div>
        `
    });
    
    marker.addListener('click', () => {
        infoWindow.open(map, marker);
    });
    
    // Adicionar o marcador à lista de marcadores
    markers.push(marker);
}

// Adicionar um local à lista de resultados
function addPlaceToList(place) {
    const placesList = document.getElementById('places-results');
    const listItem = document.createElement('li');
    
    listItem.innerHTML = `
        <div class="place-name">${place.name}</div>
        <div class="place-address">${place.vicinity}</div>
    `;
    
    // Adicionar evento de clique para centralizar o mapa no local
    listItem.addEventListener('click', () => {
        map.setCenter(place.geometry.location);
        map.setZoom(17);
    });
    
    placesList.appendChild(listItem);
}

// Limpar todos os marcadores do mapa
function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}