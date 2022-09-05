import React, { useContext, useEffect, useState } from "react"
import { LayoutAnimation, View, Dimensions, StatusBar, StyleSheet, PixelRatio, useColorScheme, Appearance, Platform, UIManager, TouchableOpacity } from "react-native"
import { Button, Icon, Text, useTheme } from "@ui-kitten/components"
import { ImageHeaderScrollView, TriggeringView } from "react-native-image-header-scroll-view"
import { Spacing } from "../constants"
import Content, { defaultSystemFonts } from "react-native-render-html"
import WebView from "react-native-webview"
import { decode } from "html-entities"
import IframeRenderer, { iframeModel } from "@native-html/iframe-plugin"
import { formatDate, generateSlug } from "../helpers/format"
import Byline from "../components/Byline"
import { minion } from "../custom-fonts"
import Model from "../Model"
import { ThemeContext } from "../theme-context"
import { useHeaderHeight } from "@react-navigation/elements"
import { FloatingAction } from "react-native-floating-action"
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from "expo-av"
import * as Device from "expo-device"

const { width, height } = Dimensions.get("window")
const pixelRatio = PixelRatio.get()
const systemFonts = [
    ...Object.keys(minion).map(key => String(key)),
    ...defaultSystemFonts
]
const articleAudio = new Audio.Sound()

Audio.setAudioModeAsync({
  playsInSilentModeIOS: true,
  allowsRecordingIOS: false,
  staysActiveInBackground: true,
  interruptionModeIOS: InterruptionModeIOS.DoNotMix,
  interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
  shouldDuckAndroid: false,
  playThroughEarpieceAndroid: false
})

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

export default function Post({ route, navigation }) {
    const { article, sourceName } = route.params
    const featuredMedia = `${article["jetpack_featured_media_url"]}?w=${pixelRatio*width}`
    const colorScheme = useColorScheme()
    const theme = useTheme()
    const dateInstance = new Date(article.date)
    const authors = article.parsely?.meta?.creator?.reduce((object, name, index) => ({...object, [name]: article.coauthors[index]}), {})
    const [displayCategory, setDisplayCategory] = useState({})
    const [caption, setCaption] = useState("")
    const [audioURL, setAudioURL] = useState("")
    const [trackStatus, setTrackStatus] = useState({})
    const { deviceType } = useContext(ThemeContext)
    const headerHeight = useHeaderHeight()
    const contentEdgeInset = deviceType === Device.DeviceType.PHONE ? 14 : 56
    const narrationEndpoint = "https://narrations.ad-auris.com/widget/the-stanford-daily/"
    const audioActions = [
      {
        position: 3,
        text: trackStatus?.isLoaded ? "" : "Listen to this article", // if track is inactive it says this and otherwise will say play/pause icon and no text
        name: "play",
        icon: <Icon name={Object.keys(trackStatus).length > 0 && !trackStatus?.isPlaying ? "pause-circle" : "arrow-right"} width={30} height={30} fill="white" />,
        color: theme["color-primary-500"]
      },
      {
        position: 2,
        name: "stop",
        icon: <Icon name="square-outline" width={20} height={20} fill="white" />,
        color: theme["color-primary-500"]
      },
      {
        position: 0,
        // text: "Skip 15 seconds",
        name: "skip",
        icon: <Icon name="skip-forward" width={30} height={30} fill="#242c45" />,
        color: "#F0F4F4"
      },
      {
        position: 1,
        // text: "Rewind 15 seconds",
        name: "rewind",
        icon: <Icon name="skip-back" width={30} height={30} fill="#242c45" />,
        color: "#F0F4F4",
      }
    ]

    const toggleTrack = async () => {
      if ("isPlaying" in trackStatus && trackStatus.isPlaying) {
        console.log("pausing")
        await articleAudio.pauseAsync()
      } else if ("isLoaded" in trackStatus && trackStatus.isLoaded) {
        await articleAudio.playAsync()
      }
    }

    const startTrack = async () => {
      try {
        // The headphone icon could become ActivityIndicator while loading. When playing, the icon could become animating vertical bars.
        await articleAudio.loadAsync({ uri: encodeURI(audioURL) })
        await articleAudio.playAsync()
      } catch (error) {
        console.log(error)
      }
    }

    const stopTrack = async () => {
      await articleAudio.stopAsync()
    }

    const skipTrack = async () => {
      console.log("skipping")
      await articleAudio.setPositionAsync(trackStatus.positionMillis + 15000)
    }

    const rewindTrack = async () => {
      console.log("rewinding")
      await articleAudio.setPositionAsync(trackStatus.positionMillis - 15000)
    }

    const renderers = {
      // Note: Chrome URL protocol causes a crash with the renderer below.
      // iframe: IframeRenderer,
      em: (props) => <Text {...props} style={{ fontFamily: "MinionProIt", fontSize: props?.tnode?.styles?.nativeTextFlow?.fontSize }}>{props?.tnode?.init?.textNode?.data}</Text>,
      strong: (props) => <Text {...props} style={{ fontFamily: "MinionProBold", fontSize: props?.tnode?.styles?.nativeTextFlow?.fontSize }}>{props?.tnode?.init?.textNode?.data}</Text>,
      // h4: (props) => <Text {...props} category="h4">{props.tnode.children[0].children[0].init.textNode.data}</Text>,
    }
    
    const customHTMLElementModels = {
      iframe: iframeModel
    }

    const Foreground = () => (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text category={deviceType === Device.DeviceType.PHONE ? "h4" : "h2"} style={{...styles.hoveringText, paddingHorizontal: deviceType === Device.DeviceType.PHONE ? 20 : 60}}>{decode(article.title.rendered)}</Text>
      </View>
    )

    useEffect(() => {
      Promise.all(article.categories.map(category => Model.categories().id(category).get())).then(p => {
        const resolvedCategory = p.filter(q => q.name === article.parsely.meta.articleSection)[0]
        setDisplayCategory(resolvedCategory)
      })

      Model.media().id(article["featured_media"]).get().then(media => {
          setCaption(decode(media.caption?.rendered).slice(3, -5))
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      })

      // Attempts to retrieve the remote narration file URL for the article.
      fetch(narrationEndpoint + article.slug).then(response => {
        const narrationPath = response.ok ? article.slug : generateSlug(decode(article.title.rendered))
        fetch(narrationEndpoint + narrationPath).then(response => response.text()).then(data => {
          var matches = data.match(/<meta.*?property="og:audio".*?content="(.*?)"/)
          if (matches) {
            let audioURL = matches[1]
            console.log(audioURL)
            setAudioURL(audioURL)
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
          }
        }).catch(error => console.log(error))
      })
      

      return () => {
        if (colorScheme === "light") {
          StatusBar.setBarStyle("dark-content", true)
        }
        if (articleAudio) {
          articleAudio.unloadAsync()
        }
      }
    }, [article])

    Appearance.addChangeListener(listener => {
      if (listener.colorScheme === "light") {
        StatusBar.setBarStyle("light-content", true)
      }
    })


    return (
      <React.Fragment>
        <ImageHeaderScrollView
          headerImage={{ uri: featuredMedia }}
          renderForeground={Foreground}
          maxOverlayOpacity={0.75}
          minOverlayOpacity={0.6}
          minHeight={headerHeight}
          maxHeight={headerHeight + featuredMedia ? 270 : 0}
          fadeOutForeground
          scrollViewBackgroundColor={theme["background-basic-color-1"]}>
          <View style={{ flex: 1, marginHorizontal: contentEdgeInset, paddingTop: deviceType === Device.DeviceType.PHONE ? undefined : Spacing.large, paddingBottom: Spacing.large }}>
            <TriggeringView>
              {caption !== "" && <Text style={{ paddingTop: Spacing.medium }} category="s1">{caption}</Text>}
              {article["wps_subtitle"] !== "" && <Text style={{ paddingTop: Spacing.medium }} category="s1">{article["wps_subtitle"]}</Text>}
              <Byline authors={authors} section={article.parsely.meta.articleSection} sourceName={sourceName} category={displayCategory} date={formatDate(dateInstance, true)} navigation={navigation} />
            </TriggeringView>
            <Content
              source={{ html: article.content.rendered }}
              defaultTextProps={{ selectable: true }}
              customHTMLElementModels={customHTMLElementModels}
              systemFonts={systemFonts}
              contentWidth={width}
              baseStyle={{ fontFamily: "MinionProRegular", fontSize: deviceType === Device.DeviceType.PHONE ? 18 : 22, color: theme["text-basic-color"], backgroundColor: theme["background-basic-color-1"] }} // TODO: Replace with PixelRatio.
              tagsStyles={{ a: { color: theme["color-primary-500"], textDecorationLine: "none" } }}
              renderers={renderers}
              WebView={WebView}
              backgroundColor={theme["background-color-basic-2"]}
              enableExperimentalMarginCollapsing
            />
          </View>
        </ImageHeaderScrollView>
        {audioURL !== "" && (
            <FloatingAction
              color={theme["color-primary-500"]}
              distanceToEdge={Spacing.large}
              floatingIcon={<Icon name="headphones-outline" width={25} height={25} backgroundColor={"transparent"} fill="white" />}
              actions={audioActions.slice(0, Object.keys(trackStatus).length === 0 || ("isLoaded" in trackStatus && !trackStatus.isLoaded) ? 1 : undefined)} // When track is inactive it only shows first button 
              onPressItem={name => {
                switch (name) {
                  case "play": trackStatus?.isLoaded ? toggleTrack() : startTrack()
                  case "stop": stopTrack()
                  case "skip": skipTrack()
                  case "rewind": rewindTrack()
                  default: break
                }
                articleAudio?.getStatusAsync().then(setTrackStatus)
              }}
            />    
        )}
      </React.Fragment>
    )
}

const styles = StyleSheet.create({
  body: {
    fontFamily: "MinionProDisp"
  },
  hoveringText: {
    color: "white",
    marginTop: 20,
    textShadowColor: "black",
    textShadowRadius: 1,
    textShadowOffset: {
      width: 1,
      height: 1
    },
    textAlign: "center",
    fontFamily: "MinionProBold",
  }
})
