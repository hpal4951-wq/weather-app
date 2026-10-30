import { BlurView } from "expo-blur";
import { MagnifyingGlass, MapPin, X } from "phosphor-react-native";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

function formatLocation(location) {
    return [location?.name, location?.state, location?.country]
        .filter(Boolean)
        .join(", ");
}

function getSearchErrorMessage(error) {
    if (!error) return "Something went wrong. Please try again.";
    if (error.status === 401) return "Weather service is not configured correctly. Please try again later.";
    if (error.status === 429) return "Too many searches. Please wait a moment and try again.";
    if (error.name === "AbortError") return "The search took too long. Check your connection and try again.";
    if (/network request failed/i.test(error.message || "")) {
        return "Network error. Check your internet connection and try again.";
    }
    return error.message || "Unable to search for that location. Please try again.";
}

export default function LocationSearch({ apiKey, onSelectLocation }) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [searching, setSearching] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const debounceRef = useRef(null);
    const requestIdRef = useRef(0);
    const suggestionsQueryRef = useRef("");
    const selectedLocationRef = useRef(null);
    const mountedRef = useRef(true);

    useEffect(function () {
        mountedRef.current = true;
        return function () {
            mountedRef.current = false;
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    function geocodeLocations(searchQuery, limit) {
        const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(searchQuery)}&limit=${limit}&appid=${apiKey}`;

        return fetch(url).then(function (response) {
            return response.json().then(function (data) {
                if (!response.ok) {
                    const message = data && typeof data.message === "string"
                        ? data.message
                        : "Location search failed";
                    const error = new Error(message);
                    error.status = response.status;
                    throw error;
                }
                return Array.isArray(data) ? data : [];
            });
        });
    }

    function handleChange(text) {
        setQuery(text);
        setErrorMessage("");
        selectedLocationRef.current = null;

        if (debounceRef.current) clearTimeout(debounceRef.current);

        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;

        const trimmed = text.trim();
        if (trimmed.length < 2) {
            suggestionsQueryRef.current = "";
            setSuggestions([]);
            setSearching(false);
            return;
        }

        setSearching(true);
        debounceRef.current = setTimeout(function () {
            geocodeLocations(trimmed, 5)
                .then(function (results) {
                    if (!mountedRef.current || requestId !== requestIdRef.current) return;
                    suggestionsQueryRef.current = trimmed;
                    setSuggestions(results);
                    if (!results.length) {
                        setErrorMessage(`No locations found for "${trimmed}".`);
                    }
                })
                .catch(function (error) {
                    if (!mountedRef.current || requestId !== requestIdRef.current) return;
                    suggestionsQueryRef.current = "";
                    setSuggestions([]);
                    setErrorMessage(getSearchErrorMessage(error));
                })
                .finally(function () {
                    if (mountedRef.current && requestId === requestIdRef.current) {
                        setSearching(false);
                    }
                });
        }, 450);
    }

    function chooseLocation(location) {
        if (!location) return;

        requestIdRef.current = requestIdRef.current + 1;
        if (debounceRef.current) clearTimeout(debounceRef.current);

        suggestionsQueryRef.current = "";
        selectedLocationRef.current = location;
        setQuery(formatLocation(location));
        setSuggestions([]);
        setErrorMessage("");
        Keyboard.dismiss();

        if (!onSelectLocation) {
            setSearching(false);
            return;
        }

        setSearching(true);
        Promise.resolve(onSelectLocation(location))
            .catch(function () { })
            .finally(function () {
                if (mountedRef.current) setSearching(false);
            });
    }

    function submitSearch() {
        const trimmed = query.trim();

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!trimmed) {
            requestIdRef.current = requestIdRef.current + 1;
            suggestionsQueryRef.current = "";
            selectedLocationRef.current = null;
            setSuggestions([]);
            setSearching(false);
            setErrorMessage("Please enter a city or location name.");
            return;
        }

        if (suggestions.length && suggestionsQueryRef.current === trimmed) {
            chooseLocation(suggestions[0]);
            return;
        }

        if (selectedLocationRef.current && formatLocation(selectedLocationRef.current) === query.trim()) {
            setSearching(true);
            setErrorMessage("");
            Promise.resolve(onSelectLocation && onSelectLocation(selectedLocationRef.current))
                .catch(function () { })
                .finally(function () {
                    if (mountedRef.current) setSearching(false);
                });
            return;
        }

        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;
        suggestionsQueryRef.current = "";
        selectedLocationRef.current = null;
        setSearching(true);
        setErrorMessage("");

        geocodeLocations(trimmed, 1)
            .then(function (results) {
                if (!mountedRef.current || requestId !== requestIdRef.current) return;
                if (!results.length) {
                    setErrorMessage(`No location found for "${trimmed}". Try a different name.`);
                    setSearching(false);
                    return;
                }
                chooseLocation(results[0]);
            })
            .catch(function (error) {
                if (!mountedRef.current || requestId !== requestIdRef.current) return;
                setErrorMessage(getSearchErrorMessage(error));
                setSearching(false);
            });
    }

    function clearSearch() {
        requestIdRef.current = requestIdRef.current + 1;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        suggestionsQueryRef.current = "";
        selectedLocationRef.current = null;
        setQuery("");
        setSuggestions([]);
        setSearching(false);
        setErrorMessage("");
    }

    return (
        <View style={styles.wrapper}>
            <BlurView intensity={60} tint="dark" style={styles.searchBlur}>
                <View style={styles.searchRow}>
                    <MagnifyingGlass size={20} color="rgba(232, 241, 243, 0.5)" weight="bold" />
                    <TextInput
                        value={query}
                        onChangeText={handleChange}
                        onSubmitEditing={submitSearch}
                        placeholder="Search city or location..."
                        placeholderTextColor="rgba(232, 241, 243, 0.5)"
                        style={styles.input}
                        returnKeyType="search"
                        autoCorrect={false}
                        autoCapitalize="words"
                        selectionColor="#4fc3f7"
                        underlineColorAndroid="transparent"
                    />
                    {searching ? (
                        <ActivityIndicator size="small" color="#4fc3f7" />
                    ) : query.length ? (
                        <TouchableOpacity onPress={clearSearch} hitSlop={8}>
                            <X size={18} color="rgba(232, 241, 243, 0.5)" weight="bold" />
                        </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                        onPress={submitSearch}
                        style={styles.searchButton}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.searchButtonText}>Search</Text>
                    </TouchableOpacity>
                </View>
            </BlurView>

            {suggestions.length ? (
                <View style={styles.suggestionsWrapper}>
                    <BlurView intensity={60} tint="dark">
                        {suggestions.map(function (item, index) {
                            return (
                                <TouchableOpacity
                                    key={`${item.lat}-${item.lon}-${index}`}
                                    onPress={function () { chooseLocation(item) }}
                                    activeOpacity={0.8}
                                    style={[
                                        styles.suggestion,
                                        index < suggestions.length - 1 ? styles.suggestionBorder : null,
                                    ]}
                                >
                                    <MapPin size={18} color="#4fc3f7" weight="fill" />
                                    <View style={styles.suggestionTextWrapper}>
                                        <Text style={styles.suggestionName} numberOfLines={1}>
                                            {item.name}
                                        </Text>
                                        <Text style={styles.suggestionDetail} numberOfLines={1}>
                                            {[item.state, item.country].filter(Boolean).join(", ")}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </BlurView>
                </View>
            ) : null}

            {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginHorizontal: 20,
        marginTop: 16,
    },
    searchBlur: {
        borderRadius: 12,
        overflow: "hidden",
    },
    searchRow: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: 50,
        paddingHorizontal: 14,
        gap: 8,
    },
    input: {
        flex: 1,
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "600",
        paddingVertical: 10,
    },
    searchButton: {
        paddingHorizontal: 6,
        paddingVertical: 8,
    },
    searchButtonText: {
        fontSize: 14,
        fontWeight: "800",
        color: "#4fc3f7",
    },
    suggestionsWrapper: {
        marginTop: 8,
        borderRadius: 12,
        overflow: "hidden",
    },
    suggestion: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    suggestionBorder: {
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.12)",
    },
    suggestionTextWrapper: {
        flex: 1,
    },
    suggestionName: {
        fontSize: 15,
        fontWeight: "700",
        color: "#ffffff",
    },
    suggestionDetail: {
        fontSize: 12,
        fontWeight: "600",
        color: "rgba(232, 241, 243, 0.5)",
        marginTop: 2,
    },
    errorText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#ffb4ab",
        marginTop: 8,
        marginLeft: 4,
    },
});
