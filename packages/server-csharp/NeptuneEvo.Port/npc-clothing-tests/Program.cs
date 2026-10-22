using System;
using Newtonsoft.Json.Linq;
using NeptuneEvo.PortCompatibility;

static void Equal(int expected, JToken actual, string label)
{
    if (actual.Value<int>() != expected) throw new Exception(label);
}

const uint Male = 1885233650;
const string Police = "{\"head\":[0,0],\"0\":[282,2],\"3\":[0,0],\"4\":[258,0],\"6\":[10,0],\"8\":[219,0],\"11\":[655,0],\"7\":[279,10]}";
var police = JObject.Parse(LegacyNpcClothing.Translate(Male, Police));
Equal(669, police["11"][0], "police top");
Equal(274, police["0"][0], "police hat");
Equal(281, police["7"][0], "police accessory");
Equal(10, police["7"][1], "texture retained");
Equal(263, police["4"][0], "police legs migrated");
Equal(223, police["8"][0], "police undershirt migrated");
var prison = JObject.Parse(LegacyNpcClothing.Translate(Male, "{\"11\":[727,0],\"3\":[4,0],\"8\":[15,0],\"4\":[294,0],\"6\":[206,0],\"0\":[295,0]}"));
Equal(741, prison["11"][0], "prison top");
Equal(287, prison["0"][0], "prison hat");
Equal(299, prison["4"][0], "prison legs migrated");
Equal(15, prison["8"][0], "prison standard undershirt retained");
Equal(206, prison["6"][0], "prison shoes retained");
foreach (var texture in new[] { 0, 2 })
{
    var shop = JObject.Parse(LegacyNpcClothing.Translate(Male, $"{{\"head\":[12,0],\"0\":[45,2],\"3\":[11,0],\"4\":[0,0],\"6\":[4,0],\"8\":[15,0],\"11\":[690,{texture}]}}"));
    Equal(704, shop["11"][0], "gas/supermarket top");
    Equal(texture, shop["11"][1], "gas/supermarket texture");
    Equal(45, shop["0"][0], "standard business hat unchanged");
    Equal(12, shop["head"][0], "business head unchanged");
}
foreach (var entry in new[] { ("11",599,613), ("11",751,765), ("7",201,203), ("1",252,249), ("0",255,247), ("8",218,222), ("8",225,229), ("4",225,230), ("4",307,312) })
{
    var result = JObject.Parse(LegacyNpcClothing.Translate(Male, $"{{\"{entry.Item1}\":[{entry.Item2},2]}}"));
    Equal(entry.Item3, result[entry.Item1][0], "custom boundary");
    Equal(2, result[entry.Item1][1], "boundary texture");
}
foreach (var entry in new[] { ("11",598), ("11",752), ("7",200), ("1",251), ("0",254), ("0",-1), ("8",217), ("8",226), ("4",224), ("4",308) })
{
    var result = JObject.Parse(LegacyNpcClothing.Translate(Male, $"{{\"{entry.Item1}\":[{entry.Item2},0]}}"));
    Equal(entry.Item2, result[entry.Item1][0], "outside legacy custom range");
}
if (LegacyNpcClothing.Translate(2627665880, Police) != Police ||
    LegacyNpcClothing.Translate(123, Police) != Police) throw new Exception("non-male preset changed");
if (LegacyNpcClothing.Translate(Male, null) != null) throw new Exception("null preset changed");
Console.WriteLine("PASS actual NPC clothing translator: police, prison, boundaries, textures, unchanged female/base/non-freemode");
