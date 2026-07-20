import { BlurView } from "expo-blur";
import { Cloud, CloudRain, CloudSnow, SunDim } from "phosphor-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
export default function forecast({ data, onPress, selected }) {

    const date_time = data?.dt_txt
    const arr= date_time.split(' ')
    const currdate = arr[0]
    const date = new Date(currdate)
    const alldays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    let day = alldays[date.getDay()]
    
    const today_date = new Date()
    if(currdate == today_date.toISOString().split('T')[0])
        day='Today'
    

    let icon = <Cloud size={44} color="#4b8db9" weight="duotone" />
    switch (data?.weather[0]?.main){

        case "Clear" : icon = <SunDim size={44} color="#c1d16b" weight="duotone" />
                         break
        case "Clouds" : icon = <Cloud size={44} color="#4b8db9" weight="duotone" />
                         break
        case "Rain"  : icon = <CloudRain size={44} color="#acbdc8" weight="duotone" />
                       break
        case "Snow"  : icon = <CloudSnow size={44} color="#ffffff" weight="fill" />
                      
    }
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            <View style={[
                style.cardWrapper,
                selected ? style.cardSelected : null,
            ]}>
                <BlurView intensity={60} tint="dark"  >
                    <View style={style.forecastbar}>
                        <Text style={style.forecasttext}>{day}</Text>
                        {icon}
                        <Text style={style.forecasttext}>{data?.main?.temp}°C</Text>
                    </View>
                </BlurView>
            </View>
        </TouchableOpacity>
    )
}
const style = StyleSheet.create({
    cardWrapper: {
        overflow: "hidden",
        borderRadius: 10,
        margin : 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },
    cardSelected: {
        borderColor: "#ffffff",
        borderWidth: 2,
    },
    forecastbar: {
        flexDirection: "row",
        height: 80,
        alignItems: "center",
        justifyContent: "space-between",
        padding: 15,
    },
    forecasttext: {
        fontSize: 17,
        fontWeight: "800",
        color: "white",
    },
    forecasttexticon: {
        fontSize: 17,
        fontWeight: "800",
        color:"rgba(232, 241, 243, 0.5)",
    },

})