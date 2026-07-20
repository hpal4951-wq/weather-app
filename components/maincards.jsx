import { BlurView } from "expo-blur";
import { Cloud, CloudRain, CloudSnow, SunDim } from "phosphor-react-native";
import { StyleSheet, Text, View } from "react-native";

export default function Cards({data}) {

    
    const date_time = data?.dt_txt
    const arr= date_time.split(' ')
    const date = arr[0]
    let time=  arr[1].split(':')

    let am_pm 
    if(Number(time[0]) > 12)
       am_pm="pm"     
    else if(Number(time[0]) == 12)
        am_pm="Noon"
    else if(Number(time[0]) == 0)
        am_pm="Mid-night"
       else 
       am_pm="am"

    let hour =Number(time[0]) % 12
    let min = time[1]
    if(hour==0)
        hour = 12
    
    let icon = <Cloud size={32} color="white" />

    switch (data?.weather[0]?.main){

        case "Clear" : icon = <SunDim size={32} color="#c1d16b" weight="duotone" />
                         break
        case "Clouds" : icon = <Cloud size={32} color="#4b8db9" weight="duotone" />
                         break
        case "Rain"  : icon = <CloudRain size={32} color="#acbdc8" weight="duotone" />
                       break
        case "Snow"  : icon = <CloudSnow size={32} color="#ffffff" weight="fill" />
                      
    }

    return (
        <View style={style.blurwrapper}>
            <BlurView intensity={60} tint="dark">
                <View style={style.card}>
                    <Text style={style.cardText}>{hour}:{min}</Text>
                    <Text style={style.cardText}>{am_pm}</Text>
                    {icon}
                    <Text style={style.cardText}>{data?.main?.temp}°C</Text>
                    <Text style={style.cardText}>{data?.weather[0]?.main}</Text>
                </View>
            </BlurView>
        </View>
    )
}
const style = StyleSheet.create({
    card: {
        alignItems: "center",
        padding: 15,
        gap : 8

    },
    blurwrapper: {
       marginVertical : 10,
        borderRadius: 20,
        marginHorizontal: 15,
        overflow: 'hidden',
        width: 100,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },

    cardText: {
        fontSize: 15,
        fontWeight: "800",
        color:"rgba(232, 241, 243, 0.5)",
    }
})