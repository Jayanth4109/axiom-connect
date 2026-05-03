import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { cssInterop } from 'react-native-css-interop';

// Enable className support for all React Native components
cssInterop(View, { className: 'style' });
cssInterop(Text, { className: 'style' });
cssInterop(TextInput, { className: 'style' });
cssInterop(TouchableOpacity, { className: 'style' });
cssInterop(ScrollView, { className: 'style', contentContainerClassName: 'contentContainerStyle' });
cssInterop(FlatList, { className: 'style', contentContainerClassName: 'contentContainerStyle' });
cssInterop(Image, { className: 'style' });
cssInterop(SafeAreaView, { className: 'style' });
cssInterop(KeyboardAvoidingView, { className: 'style' });
cssInterop(Modal, { className: 'style' });
cssInterop(Pressable, { className: 'style' });
cssInterop(ActivityIndicator, { className: 'style' });
