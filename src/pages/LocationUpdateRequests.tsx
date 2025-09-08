// frontend/src/pages/LocationUpdateRequests.tsx
const LocationUpdateRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const loadRequests = async () => {
    const response = await api.get('/workspace/location-update-requests/pending');
    setRequests(response.data);
  };
  
  const handleApprove = async (requestId: number, updateFutureStops: boolean) => {
    await api.post(`/workspace/location-update-requests/${requestId}/approve`, {
      updateFutureStops
    });
    
    Alert.alert('Onaylandı', 'Müşteri konumu güncellendi');
    loadRequests();
  };
  
  const handleReject = async (requestId: number, reason: string) => {
    await api.post(`/workspace/location-update-requests/${requestId}/reject`, {
      reason
    });
    
    Alert.alert('Reddedildi', 'Talep reddedildi');
    loadRequests();
  };
  
  return (
    <div>
      <h2>Bekleyen Konum Güncelleme Talepleri ({requests.length})</h2>
      
      {requests.map(request => (
        <Card key={request.id}>
          <h3>{request.customerName}</h3>
          <p>Talep Eden: {request.requestedByName}</p>
          <p>Neden: {request.reason}</p>
          
          <div style={{ display: 'flex', gap: 20 }}>
            {/* Eski konum */}
            <div>
              <h4>Mevcut Konum</h4>
              <MapView 
                lat={request.currentLatitude} 
                lng={request.currentLongitude}
              />
              <p>{request.currentAddress}</p>
            </div>
            
            {/* Yeni konum */}
            <div>
              <h4>Talep Edilen Konum</h4>
              <MapView 
                lat={request.requestedLatitude} 
                lng={request.requestedLongitude}
              />
              <p>{request.requestedAddress}</p>
            </div>
          </div>
          
          <div>
            <Checkbox label="Gelecekteki rotaları da güncelle" />
            <Button onClick={() => handleApprove(request.id, true)}>
              Onayla
            </Button>
            <Button onClick={() => handleReject(request.id, 'Neden...')}>
              Reddet
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};