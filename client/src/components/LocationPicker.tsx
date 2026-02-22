import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FaCrosshairs } from 'react-icons/fa';

// Fix for default Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper to move the map view when coordinates change
function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, 16); // Zooms into the new pin location
    }, [center, map]);
    return null;
}

// Helper component to handle clicks on the map
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

interface LocationPickerProps {
    initialLat?: number;
    initialLng?: number;
    initialAddress?: string;
    readOnly?: boolean;
    onLocationChange?: (lat: number, lng: number, address: string) => void;
}

export default function LocationPicker({ initialLat, initialLng, initialAddress, readOnly = false, onLocationChange }: LocationPickerProps) {
    const [position, setPosition] = useState<[number, number] | null>(
        initialLat && initialLng ? [initialLat, initialLng] : null
    );
    const [address, setAddress] = useState(initialAddress || '');
    const [loading, setLoading] = useState(false); // ✅ Restored Loading State

    const defaultCenter: [number, number] = [30.1575, 71.5249]; 

    // ✅ FIXED: Fetch Live Location AND Readable Address
    const handleGetLiveLocation = () => {
        if (!navigator.geolocation) return alert("Geolocation not supported");
        setLoading(true);

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                const newPos: [number, number] = [latitude, longitude];
                
                setPosition(newPos);

                try {
                    // Fetch readable address from OpenStreetMap
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    const readableAddress = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                    
                    setAddress(readableAddress);
                    // ✅ CRITICAL: Notify parent (StudentBooking) immediately so "Send Request" works
                    if (onLocationChange) onLocationChange(latitude, longitude, readableAddress);
                } catch (error) {
                    console.error("Address fetch error", error);
                    // Fallback to coordinates as address if API fails
                    const coordAddr = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                    setAddress(coordAddr);
                    if (onLocationChange) onLocationChange(latitude, longitude, coordAddr);
                } finally {
                    setLoading(false);
                }
            },
            () => {
                setLoading(false);
                alert("GPS error. Please check permissions or type manually.");
            },
            { enableHighAccuracy: true }
        );
    };

    const handleMapClick = async (lat: number, lng: number) => {
        if (readOnly) return;
        setPosition([lat, lng]);
        
        // When clicking the map, we also try to get the address for that point
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            const newAddr = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            setAddress(newAddr);
            if (onLocationChange) onLocationChange(lat, lng, newAddr);
        } catch (e) {
            if (onLocationChange) onLocationChange(lat, lng, address);
        }
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newAddr = e.target.value;
        setAddress(newAddr);
        if (position && onLocationChange) {
            onLocationChange(position[0], position[1], newAddr);
        }
    };

    return (
        <div className="space-y-3">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                    {readOnly ? "Selected Location" : "Pickup Address"}
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={address}
                        onChange={handleAddressChange}
                        disabled={readOnly || loading}
                        placeholder={loading ? "Fetching address..." : "Type or use GPS icon..."}
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                    
                    {!readOnly && (
                        <button
                            type="button"
                            onClick={handleGetLiveLocation}
                            disabled={loading}
                            title="Get my live location"
                            className={`bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-md flex items-center justify-center shrink-0 ${loading ? 'opacity-50 animate-pulse' : ''}`}
                        >
                            <FaCrosshairs />
                        </button>
                    )}
                </div>
            </div>

            <div className="h-64 w-full rounded-xl overflow-hidden border border-gray-300 shadow-inner z-0 relative">
                <MapContainer 
                    center={position || defaultCenter} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* Move camera and zoom in */}
                    {position && <ChangeView center={position} />}
                    
                    {!readOnly && <MapClickHandler onLocationSelect={handleMapClick} />}
                    
                    {/* Show the blue pin */}
                    {position && <Marker position={position} />}
                </MapContainer>
            </div>
            
            {!readOnly && (
                <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] text-gray-500 italic">
                        * Tap map or use GPS icon to pin location.
                    </p>
                    {position && (
                        <p className="text-[10px] font-mono text-blue-600 font-bold">
                            Coords: {position[0].toFixed(4)}, {position[1].toFixed(4)}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}