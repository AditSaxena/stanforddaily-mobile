/**
 * Post Template
 */
'use strict';

//Pre-made Components imports
import React, { Component, SafeAreaView } from 'react';
import {
  View,
  StatusBar,
  ScrollView,
  Dimensions,
  Text,
  ImageBackground,
  ActivityIndicator
} from 'react-native';

import { WebView } from 'react-native-webview'

//Components for this app imports
import Header from './common/header';
import * as Amplitude from 'expo-analytics-amplitude';
import { FONTS, COLORS, LIGHT_COLORS, DARK_COLORS, STRINGS, KEYS, CATEGORIES, HEIGHTS, MARGINS } from "../assets/constants";
import styles from './styles/post.js';
import _ from "lodash";
import HTML from '../HTML.js';
import striptags from 'striptags';
import { getPostByIdAsync } from '../helper/wpapi.js';
import { formatAuthors, getThumbnailURL, formatDate } from './common/newsfeed-item.js';
import Placeholder from './common/placeholder.js';
import ReactNativeDisqus from 'react-native-disqus';
import post from './styles/post.js';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { Appearance } from 'react-native';
import { ImageHeaderScrollView, TriggeringView } from 'react-native-image-header-scroll-view';

const amplitude = Amplitude.initialize(KEYS.AMPLITUDE_API);
const { width, height } = Dimensions.get('window'); //Dimensions of the current device screen

class Post extends Component {
  constructor(props) {
    super(props);
    this.goBack = this.goBack.bind(this);
    this.state = {
      item: null,
      width: width <= height ? width : height,
      height: Dimensions.get('window').height,
    }
    Dimensions.addEventListener('change', () => {
      const { width, height } = Dimensions.get('window')
      this.setState({ width: width <= height ? width : height, height: height });
      // console.warn("orientation changed");
    });
  }

  //A function that triggers going back to headlines
  goBack() {
    this.props.navigation.goBack();
  }

  async componentDidMount() {
    const { postID } = this.props.navigation.state.params;
    let item = await getPostByIdAsync(postID);
    this.setState({ item });
    Amplitude.logEvent(STRINGS.ARTICLE_FULL_LOADED, { ArticleId: postID });
  }

  createMarkup(text) {
    return text;
    // todo: HTML purify this if needed.
  }

  render() {
    const { item } = this.state;
    if (!item) {
      return <Placeholder />;
    }
    const { id, postTitle, postSubtitle, thumbnailInfo, postContent } = item;
    const { caption } = thumbnailInfo || {};
    const thumbnailURL = getThumbnailURL(item);
    return (
      <View style={{ flex: 1 }}>
        <StatusBar
              barStyle={Appearance.getColorScheme() === "light" ? "dark" : "light" + "-content"}
            />
        {!id && <ActivityIndicator />}
        {id &&
          <View style={{ flex: 1, alignItems: 'center' }}>

              
            <ImageHeaderScrollView maxOverlayOpacity={0.75}
          minOverlayOpacity={0.5}
          fadeOutForeground maxHeight={240} minHeight={0} scrollViewBackgroundColor={Appearance.getColorScheme() === "light" ? LIGHT_COLORS.BACKGROUND : DARK_COLORS.BACKGROUND} headerImage={{ uri: thumbnailURL !== 0 ? thumbnailURL : 'https://colourlex.com/wp-content/uploads/2021/02/Chrome-red-painted-swatch-N-300x300.jpg' } // style={styles.scrollContainer} HEIGHTS.APP_HEADER
  }           renderTouchableFixedForeground={() => (
    <Header transparent title={''} share={true} postID={id} goBack={this.goBack} isPost={true} />
  )} renderForeground={() => (
    
    <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 15, backgroundColor: 'rgba(0,0,0,0)', justifyContent: 'center', alignItems: 'center'}}>
            
    <Text style={styles.titleText}>{postTitle}</Text>
  </View>
  )}>

              {caption !== 0 &&
                <Text style={styles.caption}>{striptags(caption)}</Text>
              }
                            {postSubtitle !== "" &&
                <View style={styles.title}>
                  <HTML baseFontStyle={styles.subtitleText} html={postSubtitle} />
                </View>
              }
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={styles.authorAndDate}>
                    {/* <Text style={{ fontFamily: FONTS.PT_SERIF_BOLD }}>By {formatAuthors(item)}</Text> */}
                    <View style={{ flexDirection: 'row', maxWidth: 2*width/3, flexWrap: 'wrap' }}><Text style={styles.author}>By </Text>{item.tsdAuthors.map((info, i) => <TouchableWithoutFeedback onPress = {()=>{this.props.navigation.navigate(STRINGS.AUTHOR, { authorID: item.tsdAuthors[i].id})}}><Text style={styles.author}>{info.displayName}{i < item.tsdAuthors.length - 2 ? ', ' : i == item.tsdAuthors.length - 1 ? '' : ' and '}</Text></TouchableWithoutFeedback>)}</View>
                  <Text style={styles.date}>{formatDate(item)}</Text>
                </View>
                <View style={styles.authorAndDate}>
                  <Text style={styles.category}>{item.tsdCategories[0].name}</Text>
                </View>
              </View>
              <View style={{ marginHorizontal: MARGINS.ARTICLE_SIDES }}>
                {postContent !== 0 &&
                  <HTML
                    tagsStyles={{ 
                      p: { marginBottom: MARGINS.ARTICLE_SIDES }, 
                      a: { color: COLORS.CARDINAL }, 
                      strong: { fontFamily: FONTS.PT_SERIF_BOLD },
                      em: { fontFamily: FONTS.PT_SERIF_ITALIC }, 
                      img: { marginHorizontal: -MARGINS.ARTICLE_SIDES }, 
                      figure: { marginVertical: MARGINS.ARTICLE_SIDES },
                      figcaption: styles.caption,
                    }}
                    baseFontStyle={styles.articleText}
                    html={this.createMarkup(postContent)}
                    imagesMaxWidth={width}
                    textSelectable={true}
                  />
                }
                {/* <HTML html={"<iframe id=\"dsq-app3929\" name=\"dsq-app3929\" allowtransparency=\"true\" frameborder=\"0\" scrolling=\"no\" tabindex=\"0\" title=\"Disqus\" width=\"100%\" src=\"https://disqus.com/embed/comments/?base=default&amp;f=stanforddaily&amp;t_i=1176209%20https%3A%2F%2Fwww.stanforddaily.com%2F%3Fp%3D1176209&amp;t_u=https%3A%2F%2Fwww.stanforddaily.com%2F%3Fp%3D1176209&amp;t_d=Stanford%20Medicine%20passes%20over%20front-line%20residents%2C%20fellows%20in%20initial%20vaccine%20allocation&amp;t_t=Stanford%20Medicine%20passes%20over%20front-line%20residents%2C%20fellows%20in%20initial%20vaccine%20allocation&amp;s_o=default#version=46aa6ce1907927200257678d09dec282\" horizontalscrolling=\"no\" verticalscrolling=\"no\"></iframe>"} /> */}
              </View>
            </ImageHeaderScrollView>
          </View>}
      </View>
    );
  }
};

export default Post;
