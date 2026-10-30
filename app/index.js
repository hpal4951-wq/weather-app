import { BlurView } from "expo-blur";
import { getCurrentPositionAsync, requestForegroundPermissionsAsync } from 'expo-location';
import { Cloud, CloudRain, CloudSnow, SunDim } from "phosphor-react-native";
import { useEffect, useState } from 'react';
import { Alert, ImageBackground, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import LocationSearch from "../components/LocationSearch";
import { MapView, Marker } from "../components/MapPicker";
import Cards from "../components/maincards";
import Forecast from "../components/mainforecast";

const api_key="9838c6a015b9b5e48004593bc548de3f";

function getWeatherErrorMessage(error) {
    if (error?.status === 401) return "Weather service is not configured correctly. Please try again later."
    if (error?.status === 429) return "Too many requests. Please wait a moment and try again."
    if (error?.message && /network request failed/i.test(error.message)) {
        return "Network error. Check your internet connection and try again."
    }
    return error?.message || "Unable to fetch weather data. Please try again."
}

export default function HomePage() {
    const isWeb = Platform.OS === "web";

    useEffect(function(){
     handledevicelocation()
    },[])

    const [map, setmap] = useState(false)
    const [mapRegion, setMapRegion] = useState(null)

    function showmap() {
        setmap(true)
    }

    function closeMap() {
        setmap(false)
    }

    const [markerlocation, setmarkerlocation] = useState(null)

    function getmaplocation(maplocation) {
        const location = {
            longitude: maplocation?.nativeEvent?.coordinate?.longitude,
            latitude: maplocation?.nativeEvent?.coordinate?.latitude
        }
        setmarkerlocation(location)
    }

    const [currentlocationdata, setcurrentlocationdata] = useState(null)

    useEffect(function () {
        if (currentlocationdata?.coord) {
            setMapRegion({
                latitude: currentlocationdata.coord.lat,
                longitude: currentlocationdata.coord.lon,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
            })
        }
    }, [currentlocationdata])

    function fetchWeatherByCoords(latitude, longitude, options) {
        const weatherurl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${api_key}&units=metric`
        const forecasturl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${api_key}&units=metric`

        const weatherRequest = fetch(weatherurl)
            .then(function (response) {
                if (!response.ok) {
                    const error = new Error("Weather request failed with status " + response.status)
                    error.status = response.status
                    throw error
                }
                return response.json()
            })
            .then(function (data) {
                setcurrentlocationdata(data)
            })

        const forecastRequest = fetch(forecasturl)
            .then(function (response) {
                if (!response.ok) {
                    const error = new Error("Forecast request failed with status " + response.status)
                    error.status = response.status
                    throw error
                }
                return response.json()
            })
            .then(function (data) {
                setforecastdata(data)
            })

        return Promise.all([weatherRequest, forecastRequest])
            .then(function () {
                return true
            })
            .catch(function (error) {
                if (options?.onError) {
                    options.onError(error)
                } else {
                    Alert.alert("Weather fetch failed", getWeatherErrorMessage(error))
                }
                return false
            })
    }

    function handleSearchLocation(location) {
        if (location?.lat == null || location?.lon == null) {
            Alert.alert("Location not found", "Please choose a valid location from the search results.")
            return Promise.resolve(false)
        }

        return fetchWeatherByCoords(location.lat, location.lon).then(function (success) {
            if (success) {
                setSelectedDate(null)
            }
            return success
        })
    }


    function confirmlocation() {
        if (!markerlocation?.latitude || !markerlocation?.longitude) {
            Alert.alert("Select a location first", "Tap the map to place a marker before confirming.")
            return
        }

        closeMap()
        fetchWeatherByCoords(markerlocation.latitude, markerlocation.longitude)
    }

    const [forecastdata, setforecastdata] = useState("")
    const [selectedDate, setSelectedDate] = useState(null)

    useEffect(function () {
        const today = new Date().toISOString().split('T')[0]
        if (forecastdata?.list?.length && !selectedDate) {
            const availableDates = forecastdata.list.map(function (item) {
                return item?.dt_txt?.split(' ')[0]
            }).filter(function (value, index, self) { return value && self.indexOf(value) === index })
            const defaultDate = availableDates.includes(today) ? today : availableDates[0]
            if (defaultDate) {
                setSelectedDate(defaultDate)
            }
        }
    }, [forecastdata, selectedDate])

    function handledevicelocation() {
        requestForegroundPermissionsAsync().then(function (permission) {
            if (permission?.status == "granted") {
                getCurrentPositionAsync().then(function (response) {

                    const weatherurl = `https://api.openweathermap.org/data/2.5/weather?lat=${response?.coords?.latitude}&lon=${response?.coords?.longitude}&appid=${api_key}&units=metric`

                    fetch(weatherurl).then(function (response) {
                        response?.json().then(function (data) {

                            setcurrentlocationdata(data)
                        })
                    })
                    const forecasturl = `https://api.openweathermap.org/data/2.5/forecast?lat=${response?.coords?.latitude}&lon=${response?.coords?.longitude}&appid=${api_key}&units=metric`

                    fetch(forecasturl).then(function (response) {
                        response?.json().then(function (data) {

                            setforecastdata(data)
                        })
                    })

                })
            }
            else {
                Alert.alert("Perimssion not granted allow the permissin from settings")
            }
        })
    }

    const selectedForecast = forecastdata?.list?.filter(function (item) {
        return item?.dt_txt?.startsWith(selectedDate)
    })

    const dailyForecast = forecastdata?.list?.reduce(function (acc, item) {
        const date = item?.dt_txt?.split(" ")[0]
        if (!date) return acc
        if (!acc.some(function (entry) { return entry.date === date })) {
            acc.push({ date, item })
        }
        return acc
    }, [])

    const fivedayforecast = dailyForecast

    let icon = <Cloud size={60} color="#4b8db9" weight="duotone" />
    switch (currentlocationdata?.weather[0]?.main) {

        case "Clear": icon = <SunDim size={60} color="#c1d16b" weight="duotone" />
            break
        case "Clouds": icon = <Cloud size={60} color="#4b8db9" weight="duotone" />
            break
        case "Rain": icon = <CloudRain size={60} color="#acbdc8" weight="duotone" />
            break
        case "Snow": icon = <CloudSnow size={60} color="#ffffff" weight="fill" />

    }

    return (
        <ScrollView>
            <ImageBackground source={{ uri: "https://images.pexels.com/photos/13025342/pexels-photo-13025342.jpeg" }}>
                {/* App Title Header */}
                <View style={styles.titleHeader}>
                    <BlurView intensity={60} tint="dark" style={styles.titleBlur}>
                        <View style={styles.titleRow}>
                            <Cloud size={28} color="#4fc3f7" weight="fill" />
                            <Text style={styles.titleText}>Weather App</Text>
                        </View>
                    </BlurView>
                </View>

                <LocationSearch apiKey={api_key} onSelectLocation={handleSearchLocation} />

                <View style={styles.currentweather}>
                    <Text style={[styles.currentWeatherText, { fontSize: 50 }]}>{currentlocationdata?.name}</Text>
                    <Text style={styles.currentWeatherText}>{currentlocationdata?.main?.temp}°C</Text>
                    {icon}
                    <Text style={styles.currentWeatherText}>{currentlocationdata?.weather[0]?.main}</Text>
                </View>

                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        onPress={handledevicelocation}
                        style={styles.actionButton}
                    >
                        <BlurView intensity={60} tint="dark" style={styles.actionButtonInner}>
                            <Text style={[styles.airconditionsparenttext, { fontSize: 15 }]} >Your Location</Text>
                        </BlurView>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={showmap}
                        style={styles.actionButton}
                    >
                        <BlurView intensity={60} tint="dark" style={styles.actionButtonInner}>
                            <Text style={[styles.airconditionsparenttext, { fontSize: 15 }]} >Open Map</Text>
                        </BlurView>
                    </TouchableOpacity>
                </View>

                <Text style={styles.forecastText}>{selectedDate === new Date().toISOString().split('T')[0] ? "Today's Forecast" : selectedDate ? `${selectedDate} Forecast` : "Forecast"}</Text>
                <ScrollView horizontal style={{
                    paddingLeft: 10
                }}>
                    {
                        selectedForecast?.map(function (item, index) {
                            return <Cards key={index} data={item}></Cards>
                        })
                    }
                </ScrollView>

                <Text style={styles.forecastText}>AIR CONDITIONS</Text>

                <View style={{
                    overflow: "hidden",
                    borderRadius: 10,
                    alignSelf: "center",
                }}>
                    <BlurView intensity={60} tint="dark" style={{}} >
                        <View style={styles.airconditions}>
                            <View style={styles.airconditionsColumnparent}>
                                <View style={styles.airconditionsColumn}>
                                    <Text style={styles.airconditionsparenttext}>Feels Like</Text>
                                    <Text style={styles.airconditionschildtext}>{currentlocationdata?.main?.feels_like}</Text>
                                </View>
                                <View style={styles.airconditionsColumn}>
                                    <Text style={styles.airconditionsparenttext}>Humidity</Text>
                                    <Text style={styles.airconditionschildtext}>{currentlocationdata?.main?.humidity}</Text>
                                </View>
                                <View style={styles.airconditionsColumn}>
                                    <Text style={styles.airconditionsparenttext}>Ground Level</Text>
                                    <Text style={styles.airconditionschildtext}>{currentlocationdata?.main?.grnd_level}</Text>
                                </View>
                                <View style={styles.airconditionsColumn}>
                                    <Text style={styles.airconditionsparenttext}>Visibility</Text>
                                    <Text style={styles.airconditionschildtext}>{currentlocationdata?.visibility}</Text>
                                </View>

                            </View>
                            <View style={styles.airconditionsColumnparent}>
                                <View style={styles.airconditionsColumn}>
                                    <Text style={styles.airconditionsparenttext}>Pressure</Text>
                                    <Text style={styles.airconditionschildtext}>{currentlocationdata?.main?.pressure}</Text>
                                </View>
                                <View style={styles.airconditionsColumn}>
                                    <Text style={styles.airconditionsparenttext}>Wind</Text>
                                    <Text style={styles.airconditionschildtext}>{currentlocationdata?.wind?.speed} m/sec</Text>
                                </View>
                                <View style={styles.airconditionsColumn}>
                                    <Text style={styles.airconditionsparenttext}>Sea level</Text>
                                    <Text style={styles.airconditionschildtext}>{currentlocationdata?.main?.sea_level}</Text>
                                </View>
                                <View style={styles.airconditionsColumn}>
                                    <Text style={styles.airconditionsparenttext}>Description</Text>
                                    <Text style={styles.airconditionschildtext}>{currentlocationdata?.weather[0]?.description}</Text>
                                </View>
                            </View>
                        </View>
                    </BlurView>
                </View>

                <Text style={styles.forecastText}>5-DAY FORECAST</Text>
                {
                    fivedayforecast?.map(function (entry, index) {
                        return (
                            <Forecast
                                key={entry.date}
                                data={entry.item}
                                selected={selectedDate === entry.date}
                                onPress={function () { setSelectedDate(entry.date) }}
                            />
                        )
                    })
                }

                <Modal visible={map} transparent={true} >
                    <View style={styles.map}>
                        {MapView ? (
                            <View style={{ flex: 1 }}>
                                <Text style={styles.mapInstructions}>Tap anywhere on the map to choose a location, then press Confirm Location.</Text>
                                <Text style={styles.selectedLocationText}>
                                    {markerlocation ? `Selected: ${markerlocation.latitude.toFixed(4)}, ${markerlocation.longitude.toFixed(4)}` : "No location selected yet"}
                                </Text>
                                <MapView
                                    initialRegion={mapRegion || {
                                        latitude: 37.78825,
                                        longitude: -122.4324,
                                        latitudeDelta: 0.1,
                                        longitudeDelta: 0.1,
                                    }}
                                    onPress={getmaplocation}
                                    zoomEnabled={true}
                                    style={{
                                        height: 400,
                                    }}
                                >
                                    {markerlocation && Marker ? (
                                        <Marker
                                            coordinate={{
                                                longitude: markerlocation.longitude,
                                                latitude: markerlocation.latitude,
                                            }}
                                        />
                                    ) : null}
                                </MapView>
                                <TouchableOpacity style={styles.confirmButton} onPress={confirmlocation}>
                                    <Text>Confirm Location</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Text style={styles.mapInstructions}>Map is available only on native devices. Run this app in Expo Go or a native build to use the map picker.</Text>
                        )}
                            <TouchableOpacity style={styles.cancelButton} onPress={closeMap}>
                                <Text>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </Modal>

            </ImageBackground>

        </ScrollView>
    )
}
const styles = StyleSheet.create({
    titleHeader: {
        paddingTop: 10,
        paddingHorizontal: 20,
        alignItems: "center",
    },
    titleBlur: {
        borderRadius: 20,
        overflow: "hidden",
        paddingHorizontal: 24,
        paddingVertical: 8,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    titleText: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#ffffff",
        letterSpacing: 1.2,
    },
    currentweather: {
        alignItems: "center",
        alignSelf: "center",
        marginTop: 80,
        gap: 20,
        marginVertical: 60,
    },
    currentWeatherText: {
        fontSize: 32,
        fontWeight: "bold",
        color: "white",
    },
    forecastText: {
        fontSize: 20,
        fontWeight: "800",
        color: "rgba(232, 241, 243, 0.5)",
        marginVertical: 30,
        marginLeft: 20
    },
    airconditions: {

        flexDirection: "row",
        justifyContent: "center",
        padding: 20,
        gap: 50,
        borderRadius: 10

    },
    airconditionsColumnparent: {
        gap: 10,
        marginHorizontal: 10

    },
    airconditionsparenttext: {
        fontSize: 20,
        fontWeight: "800",
        color: "rgba(232, 241, 243, 0.5)",
    },
    airconditionschildtext: {
        fontSize: 15,
        fontWeight: "800",
        color: "white",
    },
    airconditionsColumn: {
        alignItems: "center"
    },
    buttonRow: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 12,
        marginVertical: 20,
    },
    actionButton: {
        minWidth: 140,
        borderRadius: 10,
        overflow: "hidden",
    },
    actionButtonInner: {
        padding: 10,
        alignItems: "center",
    },
    map: {
        width: "90%",
        position: "absolute",
        marginHorizontal: 22,
        marginVertical: 200,
        backgroundColor: "rgba(0,0,0,0.75)",
        padding: 10,
        borderRadius: 16,
    },
    confirmButton: {
        backgroundColor: "white",
        height: 40,
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
    },
    cancelButton: {
        backgroundColor: "rgba(255,255,255,0.9)",
        height: 40,
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
    },
    mapInstructions: {
        color: "white",
        marginBottom: 10,
        textAlign: "center",
        fontSize: 16,
    },
    selectedLocationText: {
        color: "white",
        marginBottom: 10,
        textAlign: "center",
        fontSize: 14,
        opacity: 0.9,
    },
})