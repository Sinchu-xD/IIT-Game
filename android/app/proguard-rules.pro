-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.applet.Applet
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider
-keep public class com.indianidle.tycoon.MainActivity
-keepclassmembers class * {
    public <init>(org.json.JSONObject, org.json.JSONArray);
}
-keepclassmembers class * {
    void *(**OnEvent);
}
