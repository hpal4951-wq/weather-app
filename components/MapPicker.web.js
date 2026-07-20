import React from "react";
import { View, Text } from "react-native";

export function MapView(props) {
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ color: "white" }}>Map picker is unavailable on web.</Text>
    </View>
  );
}

export function Marker() {
  return null;
}
