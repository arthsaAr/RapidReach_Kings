/*import { Text, View } from "react-native";

export default function LiveLocationScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Text className="text-2xl font-bold text-gray-800">Live Map</Text>
      <Text className="text-gray-500 mt-2">Tracking nearby responders...</Text>
    </View>
  );
}
*/

import type { LocationObjectCoords } from 'expo-location';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Button, PermissionsAndroid, Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker, Polyline } from 'react-native-maps';

const initialRegion = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const SimpleMap = () => (
  <MapView
    style={{ flex: 1 }}
    initialRegion={initialRegion}
    provider="google"
    showsUserLocation={true}
  >
    <Marker coordinate={{ latitude: 37.78825, longitude: -122.4324 }} title="Marker Title" description="Marker Description" />
  </MapView>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
});

export default function LiveLocationScreen() {
  const [location, setLocation] = useState<LocationObjectCoords | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      let current = await Location.getCurrentPositionAsync({});
      setLocation(current.coords);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={{
          //initial region set to user's location or default coordinates
          latitude: location?.latitude ?? 37.78825,
          longitude: location?.longitude ?? -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="You are here"
          />
        )}
      </MapView>
    </View>
  );
}

type LocationType = {
  coords: { latitude: number; longitude: number };
  title: string;
  description: string;
};

const MarkerExample = ({ locations }: { locations: LocationType[] }) => (
  <MapView initialRegion={initialRegion} style={{ flex: 1 }}>
    {locations.map((loc, index) => (
      <Marker
        key={index}
        coordinate={loc.coords}
        title={loc.title}
        description={loc.description}
        pinColor="red"
        onPress={() => console.log('Marker pressed!')}
      />
    ))}
  </MapView>
);

// Example marker with callout (move outside main component if needed)
const markerCoords = { latitude: 37.78825, longitude: -122.4324 };

const MarkerWithCallout = () => (
  <Marker coordinate={markerCoords}>
    <Callout onPress={() => alert('Callout tapped!')}>
      <View>
        <Text style={{ fontWeight: 'bold' }}>Destination A</Text>
        <Text>Click to view details!</Text>
        <Button title="Go" onPress={() => console.log('Routing now!')} />
      </View>
    </Callout>
  </Marker>
);

const routeCoordinates = [
  { latitude: 37.78825, longitude: -122.4324 },
  { latitude: 37.78925, longitude: -122.4334 },
  { latitude: 37.79025, longitude: -122.4344 },
];  
<MapView style={{ flex: 1 }} initialRegion={initialRegion}>
  <Polyline
    coordinates={routeCoordinates}
    strokeColor="#007BFF" // bright blue line color
    strokeWidth={4} // thicker line for better visibility

  />
</MapView>

const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    try {      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        { 
          title: 'Location Permission', 
          message: 'This app needs access to your location.', 
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
          buttonNeutral: 'Ask Me Later',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  } 
    return true; // iOS permissions are handled by expo-location
  }

  const [currentLocation, setCurrentLocation] = useState<LocationObjectCoords | null>(null);
  useEffect(() => {
    (async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        console.error('Permission to access location was denied');
        return;
      }

      try {
        let current = await Location.getCurrentPositionAsync({});
        setCurrentLocation(current.coords);
      } catch (error) {
        console.error('Error getting current position:', error);
      }
    })();
  }, []);