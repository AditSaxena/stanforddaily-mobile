import { STRINGS, CATEGORIES, HOME_SECTIONS, CATEGORY_ICONS, KEYS, FONTS, COLORS, LIGHT_COLORS, DARK_COLORS, MARGINS } from '../assets/constants.js';
import React, { useState, useRef, useEffect } from 'react';
import { Image, Linking, Appearance, useColorScheme } from 'react-native';
import {
  View,
  Text,
  Dimensions,
  StatusBar,
  FlatList,
  TouchableOpacity,
  TouchableHighlight,
  ScrollView
} from 'react-native';
import Drawer from 'react-native-drawer'

//Components for this app imports
import Header from './common/header';
import NewsFeedItem from './common/newsfeed-item';
import Separator from './common/Separator';
import SettingsPage from './SettingsPage.js';
import _ from 'lodash';
import { Ionicons } from '@expo/vector-icons';
import { Icon } from 'react-native-elements';
import Carousel, { Pagination, getInputRangeFromIndexes } from 'react-native-snap-carousel';
import CardRow from './common/card-row';
import Card from './common/Card'
import Column from './common/column';
import HTML from '../HTML';

//Styles for the page
import styles from './styles/headlines';

import * as Amplitude from 'expo-analytics-amplitude';
import { getHomeAsync, getCategoryAsync, getHomeMoreAsync } from '../helper/wpapi.js';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
// import { useTheme } from './styles/themes.js';
// import { Card } from 'react-native-elements';

const amplitude = Amplitude.initialize(KEYS.AMPLITUDE_API);

//A map between categories names and their codes
const { width, height } = Dimensions.get('window');
const drawerStyles = {
  drawer: { shadowColor: COLORS.BLACK, shadowOpacity: 0.8, shadowRadius: 3 },
}
const carouselProps = {
  vertical: 50,
  horizontal: 50
}

//

const CATEGORY_HOME = CATEGORIES[0];
export const getThumbnailURL = ({thumbnailInfo}) => thumbnailInfo ? (thumbnailInfo.urls.mediumLarge || thumbnailInfo.urls.full): null;

export default (props) => {

  const [category, setCategory] = useState(CATEGORY_HOME);
  // const [articles, setArticles] = useState([]);
  const [allArticles, setAllArticles] = useState([]);
  const [modalVisible, setModalVisible] = useState(false); // TODO: show modal by default
  const [pageNumber, setPageNumber] = useState(1);
  const [opinionsScrollPosition, setOpinionsScrollPosition] = useState(0);
  const [humorScrollPosition, setHumorScrollPosition] = useState(0);
  const drawerRef = useRef();
  const listRef = useRef();
  const setTextStyle = (cat) => {
    if (cat === category) {
      return { color: COLORS.CARDINAL, fontFamily: FONTS.OPEN_SANS, marginLeft: MARGINS.ARTICLE_SIDES };
    }
    return { color: COLORS.BLACK, fontFamily: FONTS.OPEN_SANS, marginLeft: MARGINS.ARTICLE_SIDES };
  }
  const SideMenu = () => (
    <View style={styles.sideMenuContainer}>
      <View style={styles.sideBarTitle}>
        <Text style={styles.sideBarTitleText}> Sections </Text>
      </View>
      <FlatList
        data={CATEGORIES}
        style={styles.flatListStyle}
        ItemSeparatorComponent={() => <View style={styles.separator} /> }
        renderItem={({ item }) =>
          <TouchableOpacity onPress={() => { setCategory(item); drawerRef.current.close(); listRef.current.scrollToLocation({ animated: false, sectionIndex: 0, itemIndex: 0, viewPosition: 2 }); }}>
            <View style={styles.sideMenuItem}>
              <Ionicons name={CATEGORY_ICONS[item.name]} style={setTextStyle(item)} size={16} />
              <Text style={setTextStyle(item)}>{item.name}</Text>
            </View>
          </TouchableOpacity>
        }
      />
      <TouchableHighlight style={{ width: '100%', marginLeft: 28 }}>
        <TouchableOpacity
          onPress={() => setModalVisible(!modalVisible)}>
          <View style={styles.sideMenuItem}>
          <Image
            style={{
              width: 16,
              height: 16
            }}
            source={require('../media/gears.png')}
          />
          <Text style={{
            fontSize: 13,
            fontFamily: FONTS.OPEN_SANS,
            color: THEME.LABEL,
            marginLeft: MARGINS.ARTICLE_SIDES
          }}>
            Notification Settings
          </Text>
          </View>
        </TouchableOpacity>
      </TouchableHighlight>
    </View>
  );
  const _renderRow = ({item, index}) => {
      return (<NewsFeedItem
              key={"article-" + item.id}
              item={item}
              index={index}
              slideIndex={activeSlide}
              isFeatured={true}
              onPress={ () => props.navigation.navigate(STRINGS.POST, { postID: item.id })}
              onAuthor={ (authorID) => props.navigation.navigate(STRINGS.AUTHOR, { authorID: authorID }) } />);
  };

const _renderCardRow = ({item}) => {
  return (
    <Card
      item={item}
      navigation={props.navigation}
      onPress={ () => props.navigation.navigate(STRINGS.POST, { postID: item.id })} 
    />    
  );
};

const _renderColumn = ({item}) => {

  return (
    <Column
      item={item}
      navigation={props.navigation}
    />
  )
}

const _renderImage = ({item}) => {
  return (
    <TouchableWithoutFeedback onPress={ () => props.navigation.navigate(STRINGS.POST, { postID: item.id })}>
      <Image style={{width: width, height: width, resizeMode: 'contain'}} source={{ uri: getThumbnailURL(item) }}/>
    </TouchableWithoutFeedback>
  )
}

  useEffect(() => {
    (async () => {
      if (category.slug === CATEGORY_HOME.slug) {
        if (pageNumber === 1) {
          const homeResults = await getHomeAsync();
          console.log(homeResults);
          const flattenedResults = [];
          const unFlattenedResults = {};
          for (let section of HOME_SECTIONS) {
            flattenedResults.push(...(homeResults[section] || []));
            unFlattenedResults[section] = homeResults[section]
          }
          // setArticles(flattenedResults);
          setAllArticles(unFlattenedResults);
        } else {
          // setArticles(await getHomeMoreAsync(pageNumber));
        }
      } else {
        const {posts} = await getCategoryAsync([category.slug], pageNumber);
        // setArticles(posts);
      }

    })();
  }, [pageNumber, category]);

  const [activeSlide, setActiveSlide] = useState(0);
  const colorScheme = useColorScheme();
  const THEME = colorScheme === 'light' ? LIGHT_COLORS : DARK_COLORS

  return (
    <Drawer
      type={STRINGS.STATIC}
      ref={drawerRef}
      content={<SideMenu />}
      openDrawerOffset={0.4}
      styles={drawerStyles}
      tweenHandler={Drawer.tweenPresets.parallax}
      captureGestures={true}
      negotiatePan={true}
      tapToClose={true}
      onOpenStart={() => StatusBar.setHidden(true)}
      onCloseStart={() => StatusBar.setHidden(false)}
    >
      <View>
        <SettingsPage
          visible={modalVisible}
          setModalVisible={() => setModalVisible(!modalVisible)}
        />
      </View>

      <Header 
        drawerHandler={() => drawerRef.current.open()} 
        // TODO: enable search.
        // searchHandler={() => props.navigation.navigate(STRINGS.SEARCH, {})} 
        title={category.slug === CATEGORY_HOME.slug ? undefined : category.name}
        searchNavigator={() => props.navigation.navigate(STRINGS.SEARCH)}
        />
      <View style={{ flex: 1, backgroundColor: THEME.BACKGROUND, alignItems: 'center' }}>
        <StatusBar
          barStyle={colorScheme}
        />
        <ScrollView>
        <Carousel
            layout={"default"}
            data={allArticles['featured']}
            renderItem={_renderRow}
            sliderWidth={width}
            itemWidth={width - 2*MARGINS.DEFAULT_LARGE_MARGIN}
            activeSlideAlignment={'start'}
            inactiveSlideScale={1}
            onSnapToItem={index => setActiveSlide(index)}
            onLayout={index => setActiveSlide(index)}
          />
          <CardRow
            data={allArticles['news']}
            renderItem={_renderCardRow}
            title={"News"}
            onPress={ () => props.navigation.navigate(STRINGS.CATEGORY, { data: allArticles['news'], title: 'News', navigation: props.navigation })} 
          />
          <Separator />
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <HTML containerStyle={styles.titleContainer} baseFontStyle={styles.header} html={"Opinions"} />
            <TouchableOpacity style={styles.more} onPress={ () => props.navigation.navigate(STRINGS.CATEGORY, { data: allArticles['opinions'], title: 'Opinions', navigation: props.navigation })}>
                <Text style={styles.titleContainer, styles.titleFont, styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={_.chunk(allArticles['opinions'], 3)}
            renderItem={_renderColumn}
            horizontal={true}
            snapToAlignment={"start"}
            snapToInterval={width}
            decelerationRate={"fast"}
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            onScroll={e => setOpinionsScrollPosition(e.nativeEvent.contentOffset.x)}
          />
          <Pagination activeDotIndex={Math.round(opinionsScrollPosition/width)} dotsLength={_.chunk(allArticles['opinions'], 3).length} containerStyle={{ paddingVertical: 1 }} />
          <Separator />
          <CardRow
            data={allArticles['sports']}
            renderItem={_renderCardRow}
            title={"Sports"}
            onPress={ () => props.navigation.navigate(STRINGS.CATEGORY, { data: allArticles['sports'], title: 'Sports', navigation: props.navigation })}
          />
          <Separator />
          <CardRow
            data={allArticles['artsAndLife']}
            renderItem={_renderCardRow}
            title={"Arts & Life"}
            onPress={ () => props.navigation.navigate(STRINGS.CATEGORY, { data: allArticles['artsAndLife'], title: 'Arts and Life', navigation: props.navigation })}
          />
          <Separator />
          <CardRow
            data={allArticles['theGrind']}
            renderItem={_renderCardRow}
            title={"The Grind"}
            onPress={ () => props.navigation.navigate(STRINGS.CATEGORY, { data: allArticles['theGrind'], title: 'The Grind', navigation: props.navigation })} 
          />
          <Separator />
          <View style={{flexDirection: 'row', backgroundColor: THEME.SECONDARY_ACCENT, justifyContent: 'space-between'}}>
            {/* <Image containerStyle={styles.titleContainer} style={styles.titleImage} source={require('../media/artsAndLife.png')} /> */}
            <HTML containerStyle={styles.titleContainer} baseFontStyle={styles.header} html={"Humor"} />
            <TouchableOpacity style={styles.more} onPress={ () => props.navigation.navigate(STRINGS.CATEGORY, { data: allArticles['humor'], title: 'Humor', navigation: props.navigation })}>
                <Text style={styles.titleContainer, styles.titleFont, styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={_.chunk(allArticles['humor'], 3)}
            renderItem={_renderColumn}
            horizontal={true}
            snapToAlignment={"start"}
            snapToInterval={width}
            decelerationRate={"fast"}
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            style={{backgroundColor: THEME.SECONDARY_ACCENT}}
            onScroll={e => setHumorScrollPosition(e.nativeEvent.contentOffset.x)}
            />
            <Pagination activeDotIndex={Math.round(humorScrollPosition/width)} dotsLength={_.chunk(allArticles['humor'], 3).length} containerStyle={{ paddingVertical: 1 }} />
          <Separator />
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <HTML containerStyle={styles.titleContainer} baseFontStyle={styles.header} html={"Cartoons"} />
            <TouchableOpacity style={styles.more} onPress={ () => props.navigation.navigate(STRINGS.CATEGORY, { data: allArticles['cartoons'], title: 'Cartoons', navigation: props.navigation })}>
                <Text style={styles.titleContainer, styles.titleFont, styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <Carousel
            layout={'default'}
            data={allArticles['cartoons']}
            renderItem={_renderImage}
            sliderWidth={width}
            itemWidth={width}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginRight: MARGINS.ARTICLE_SIDES }}>
            <TouchableOpacity onPress={ () => {Linking.openURL('https://open.spotify.com/show/2ty8gvAnvYP31X8TUrFwoj?si=YmnmqxYuSFq8U2mv_P2fCg')}}><Icon name="spotify" size={32} type="font-awesome" color={THEME.PRIMARY_ACCENT} /></TouchableOpacity>
            <TouchableOpacity style={{ marginLeft: 10 }} onPress={ ()=>{ Linking.openURL('https://www.youtube.com/channel/UCWg3QqUzqxXt6herm5sMjNw')}}><Ionicons name="logo-youtube" size={32} color={THEME.PRIMARY_ACCENT} /></TouchableOpacity>
          </View>

                    {/* <SectionList
          ref={listRef}
          removeClippedSubviews={false}
          disableVirtualization={true}
          // refreshing={refreshing}
          keyExtractor={item => `list-key-${item.id}`}
          // onRefresh={() => setRefreshing(true)}
          // onEndReached={() => setPageNumber(pageNumber + 1)}
          sections={[{ data: articles, key: `category-list-${pageNumber}-${category}` }]}
          renderItem={_renderRow}
          //renderSectionHeader={() => this.renderSectionHeader()}
          ListFooterComponent={() => <ActivityIndicator style={styles.loadingIndicator} />}
          contentContainerStyle={{ width: width }}
        /> */}
        </ScrollView>
      </View>
    </Drawer>

  )
}

// export default class extends React.Component() {
//   render() {
//     return <HeadlinesComponent {...this.props} />;
//   }
// }