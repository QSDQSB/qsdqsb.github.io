---
title: "In the Naming of Light"
date: 2026-09-30
permalink: /posts/in-the-naming-of-light/
excerpt: "A sundial counts only the bright hours. We tried to name them."
seo_description: "How QSD's Palette and Reverie were made: a sun angle for every photograph, five colours for every voyage, and names for them from Robert Ridgway's 1912 colour book."

tags:
  - 📘Diary
  - 💍Horcrux
  - 🐮Ox
header:
  overlay_image: https://img.qsdqsb.com/t/456b380498620c18/1920.webp # oxford/dscf1939, Magdalen College: the leaf on the bench
  overlay_position: "15% 70%" # the leaf clear of the title on a phone, and off the foot's shade on a desktop
  overlay_filter: 0.35
body_class: essay # one accent (brass links), white chapter titles, air at chapter breaks (_sass/_page.scss)
toc: true
toc_sticky: true
lang: zh # the body is Chinese (_layouts/single.html sets it on the text)
---

<div data-bilingual>
<section data-bilingual-lang="中" lang="zh" markdown="1">

想写一篇日志，记一下 qsdqsb.com 新加的两个功能：[Palette](/palette/) 和 [Reverie](/reverie/)。

## I. Umbra sumus
{: lang="la"}
> 我们是影子 *We are shadows.*{: lang="en"}
{: .gloss}

古希腊人给时间起过两个名字。一个是 _chronos_，钟面上一格一格走过的时间；一个是 _kairos_，「恰好的那一刻」。

相机参数表只认识前一个。每张照片的metadata里记着光圈、焦距、ISO，和拍摄时间。但发给朋友的时候，没有人在乎那是下午四点四十二分。我们想分享的是那时候的光：从哪边来，有多低，把雪照成了什么颜色。

「Photo-graphy」，用光-书写。QSD想到了，结合GPS和拍摄时间，我们可以给每张照片算出当时的太阳角度——日落了吗，还是蓝调、晚霞？也可以还原天气。

于是他revamp了整个相册界面。网站上，照片旁边写的不是 16:42，而是 _Golden hour_，或者 _Afternoon light · 19°_：太阳离地平线 19 度。QSD记得他在Rigi时没带围巾，冲锋衣防风不保暖，脸被冻得够呛。

Implementation大概花了一天（Thanks to Claude）。然后开始给这个functionality命名。最后选了「[Palette](/palette/)」。

另一个candidate是gnomon：「日晷上投影子的那根针」。针什么都不用做，站在太阳底下就行，影子会告诉它现在几点。封面那张石凳上也站着一根 gnomon：凳面上落了一片叶子，影子投在石头上。在希腊语里，gnomon也有「知道的人」的意思（γνώμων，「识者、判读者」）。QSD在那天只顾看云海和晚霞，没注意自己的影子被拉了多长。

在他敲那段「用经纬度和时刻算太阳角度」的 prompt 时，他又发现了一个典故。罗马的第一座公共日晷是公元前 263 年从西西里的卡塔尼亚搬回来的战利品。它按卡塔尼亚的纬度造，在罗马一直不准。罗马人就这么用了九十九年，才有人在旁边立了一座准的。

同样的光明年还会再从一模一样的角度照过来，除非天上的云很厚。


## II. Pereunt et imputantur
{: lang="la"}
> 时辰逝去，记在我们账上 *They perish, and are reckoned to our account.*{: lang="en"}
{: .gloss}

太阳角度说的是光从哪里来，颜色说的是光落下来以后做了什么。所以最后叫 Palette。

<figure>
  <img src="/images/posts/all-souls-sun-dial.jpg" alt="牛津 All Souls 学院图书馆上方的日晷，底下的卷轴上刻着 PEREUNT ET IMPUTANTUR" width="3250" height="1828" loading="lazy" decoding="async">
</figure>

All Souls图书馆的入口上方有一座日晷，出自Christopher Wren之手。底下的卷轴上刻着 _Pereunt et imputantur_：时辰一个个过去，都记在我们账上。

这座日晷用四年的时间教会了QSD，很多日晷底下都会刻一句拉丁文。所以QSD给这篇文章的每个章节选了一句日晷底下的刻文作为标题。

Palette 做的事情差不多就是记账。每张照片先被读成 24 个颜色点，再合成五种颜色和各自的占比；一段旅程也是这样记。[Rigi](/palette/#rigi) 记下来是：38% 深蓝，25% 灰紫，18% 雾蓝，11% 红褐，8% 杏橙。如果画面里有一小块颜色特别鲜艳，和其他颜色都不一样，我们把它单独标出来，叫「accent」。它常常是我们第一眼注意到的颜色：森林中的一座神社，雪地蓝天之下一小卷粉色的彩云。

{% include colour-figure.html kind="palette" voyage="rigi" %}

下一个问题是每一笔颜色该叫什么。[{% include colour-code.html c="c4695d" %}](/reverie/?c=c4695d) 不是名字，「红褐色」又太敷衍。

QSD 最后找到的是一本 1912 年的书：美国鸟类学家 Robert Ridgway 的 [_Color Standards and Color Nomenclature_](https://www.gutenberg.org/files/63087/63087-h/63087-h.htm)。他断断续续做了二十多年，给 1,115 种颜色起了名字。他在前言里说，「没有标准，颜色的命名就只能停在 absolute chaos」。QSD不喜欢chaos。

于是 {% include colour-code.html c="c4695d" %} 有了名字，叫 Cinnamon-Rufous，「肉桂赭色」；[{% include colour-code.html c="2f3d59" %}](/reverie/?c=2f3d59) 叫 Indulin Blue，「引杜林蓝」。

{% include colour-figure.html kind="chips" colours="c4695d 2f3d59" %}

离得不够近的，就没有名字。这些颜色需要等人来命名。

{% include colour-figure.html kind="chips" colours="326b8b" %}


## III. Horas non numero nisi serenas
{: lang="la"}
> 我只计算晴朗的时辰 *I count no hours but the serene.*{: lang="en"}
{: .gloss}

哈兹里特有一篇随笔叫[《论日晷》](http://essays.quotidiana.org/hazlitt/sun-dial/)，开头就是这句话。他说这是威尼斯附近一座日晷上的铭文，然后感叹：「多么温和、多么消愁解忧的感受！」

说得很美，只是没提一件事：日晷自己也没得选。阴天没有影子，它想数也数不了。拉丁铭文习惯把一个缺陷说成一种品格。

如果卢塞恩有这样一座日晷，它对 QSD 应该没什么印象。QSD前后经过卢塞恩三次，加起来七天有余，基本没见过太阳。

瑞士的山上装着很多 webcam，一天二十四小时对着同一座山峰。大部分时候没有人看，画面里只有雾。在十二月的那几天，我们是少数会看的人：每天打开好几次，看云停在多高，山脊有没有露出来，像在看一座别人家的日晷。QSD还跟 ChatGPT 补了一星期地理，知道了瑞士冬天的低压，知道了卢塞恩周围每一座山的名字。

出发那天，Alpenglow 上的晚霞概率写着 25%。并不是一个让人安心的数字。

但能准备的都准备了，剩下的不归我们管，只能赌一把。

于是我们坐上了上山的齿轨火车。


## IV. Sine sole sileo
{: lang="la"}
> 没有太阳，我就沉默 *Without the sun, I fall silent.*{: lang="en"}
{: .gloss}

{% include colour-figure.html kind="frames" voyage="rigi" frames="dscf5721 dscf5730 dscf5735 dscf5741 dscf5750 dscf5760 dscf5778 dscf5789" %}

[Rigi 的相册](/voyage/rigi/)里一共八张照片。前六张的标签都是 Golden hour。在QSD的代码定义中是「离日出或日落不到十五分钟」。剩下两张，太阳已经沉到地平线以下，一张是 Blue hour，一张被写作了 Night。

太阳的角度书写着时间。八张照片，从低斜的太阳一路排到地平线以下。这本相册本身就是一座日晷。

Palette 的调色板也跟着太阳走。前三张的 accent 只是一点暖色，3.6% 到 3.9%。第四张的太阳贴着云海落下去，accent 涨到 17.4%。到第五、第六张，预报里没有的卷云被映成粉紫，占了画面的 62.8% 和 52.5%。只有一小撮特别不一样的颜色会被标记成 accent；当粉色铺满整片天，就再也找不到「和其他颜色都不一样」的颜色了。那两张照片没有 accent。

那天的晚霞，在 Ridgway 的书里叫 Old Rose、Deep Hyssop Violet 和 Eupatorium Purple。Eupatorium 是一种野草，学名来自本都国王米特拉达梯六世，就是那位据说每天服一点毒药、好让自己毒不死的国王。阿尔卑斯的晚霞名字绕了一圈，落在一个怕被毒死的国王身上，Ridgway 大概没想过这些，他写这本书，是给动物学家、植物学家、病理学家和矿物学家用的。

{% include colour-figure.html kind="chips" colours="d27071 7f667f af7c9c" %}

日晷无法在夜晚计算时间，古罗马人也遇到过这个问题。卡塔尼亚那座不准的日晷被换掉之后又过了五年，西庇阿·纳西卡在罗马立起第一座水钟，白天黑夜都能报时，古罗马人终于能在阴天知道现在是几点了。

网站算太阳角度的那段代码，大概就是我们的水钟。最后那张照片里已经没有影子可读了，代码精确算出太阳在地平线下六度以下。我们给图片标上 Night。

{% include colour-figure.html kind="frame" voyage="rigi" frame="dscf5789" %}

## V. Ultima latet ut observentur omnes
{: lang="la"}
> 最后一个时辰被藏起来，好让我们留心每一个 *The last hour is hidden, so that we watch them all.*{: lang="en"}
{: .gloss}

网站上给颜色找名字的页面叫 [Reverie](/reverie/)：点开一个颜色，写上离它最近的 Ridgway 名字，再找出所有含有这个颜色的照片。

{% include colour-figure.html kind="reverie" colour="ce7d99" %}

Reverie来自古法语 _resver_，本来的意思是「游荡、说胡话」，后来才变成 _rêver_，「做梦」。QSD 想要的就是这种游荡。Palette按照地点记录，Reverie该允许我们在记忆中畅游，一个颜色就是全部的线索。布拉格的暮色可以排在 Rigi 的晚霞旁边，中间隔着好几年和好几个国家。页面下面还有一排 Nearby，是离这个颜色一步之遥的颜色。点开一个就走进另一场 Reverie。

点开Rigi晚霞中的一块粉色，你能游荡到[{% include colour-code.html c="ce7d99" %}](/reverie/?c=ce7d99)，它在 Ridgway 书里的名字是 Daphne Pink。

_Daphne_ 是瑞香属的学名，希腊语里的意思是「月桂」。在《变形记》中，河神的女儿Daphne被太阳神阿波罗追赶，眼看就要被追上，她向父亲祈求，变成了一棵月桂树。

所以这个颜色的名字背后，是一个逃离太阳的人。而它出现的时候，太阳刚刚落下去。

写到这里本来很想借题发挥，但 Ridgway 在前言里先把话说清楚了：这些色板 「not to show the color of the particular objects or substances which the names suggest」。名字并不代表它所指之物的颜色。Daphne Pink 不是瑞香花的粉色，他在命名时估计也没考虑过达芙妮的故事。

这个档案里现在有六百多张照片，但是算法没有找到相似的粉色。比较近的有 [{% include colour-code.html c="ad6e89" %} Daphne Red](/reverie/?c=ad6e89)，还有一张Lake Bled的晚霞。后面的山比较低，雪已经全化了。

{% include colour-figure.html kind="chips" colours="ad6e89" %}

_QSD reveries in only this photograph… for now._
{: lang="en"}


</section>
<section data-bilingual-lang="EN" lang="en" markdown="1">

Wanted to write a log about two new features on qsdqsb.com: [Palette](/palette/) and [Reverie](/reverie/).

## I. Umbra sumus
{: lang="la"}
> *We are shadows.*
{: .gloss}

The ancient Greeks had two names for time. One was _chronos_, the time that walks the clock face notch by notch; the other was _kairos_, the one right moment.

The camera's settings know only the first. Every photograph's metadata records the aperture, the focal length, the ISO and the time it was taken. But when we send the picture to someone, we don't care if it was 4:42pm. What we want to share is the light at that hour: which side it came from, how low it was, what colour it turned the snow.

_Photo-graphy_: to write with light. QSD realised that from the GPS and the time of capture, we could work out the sun's angle for every photograph — had it set yet, or was it the blue hour, the afterglow? The weather, too, could be brought back.

So he revamped the whole gallery's logic. On the site, what sits beside a photograph is not 16:42 but _Golden hour_, or _Afternoon light · 19°_: the sun was at 19 degrees above the horizon. QSD remembers he had no scarf on Rigi Kulm; his shell jacket kept out the wind but not the cold, and his face was raw with it.

Implementation took about a day (thanks to Claude). Then came the naming of it. In the end, the choice was [Palette](/palette/).

The other candidate was _gnomon_: the pin on a sundial that casts the shadow. The pin has nothing to do but stand in the sun, and the shadow will tell it the hour. There is a gnomon on the stone bench in the cover photograph, too. A leaf sits on the bench, and its shadow lies across the stone. In Greek, _gnomon_ also means *the one who knows* (γνώμων, *a knower, an interpreter*). That day QSD had eyes only for the sea of clouds and the afterglow, and never noticed how far his own shadow had stretched.

While he was typing the prompt _Calculate the sun's angle with latitude, longitude and time data_, he came across another story. Rome's first public sundial was war booty, carried home from Catania in Sicily in 263 BC. It had been built for Catania's latitude, so it was never faithful in Rome. The Romans lived with the wrong time for ninety-nine years before an accurate dial was built beside it.

The same light falls again next year, from exactly the same angle. Unless the clouds are unforgiving.


## II. Pereunt et imputantur
{: lang="la"}
> *They perish, and are reckoned to our account.*
{: .gloss}

The sun's angle tells where the light came from; colour tells what it did once it fell. So, in the end, we decided to call it Palette.

<figure>
  <img src="/images/posts/all-souls-sun-dial.jpg" alt="The sundial above the library at All Souls College, Oxford; on the scroll beneath it, PEREUNT ET IMPUTANTUR" width="3250" height="1828" loading="lazy" decoding="async">
</figure>

Above the entrance to the library at All Souls College, there is a sundial made by Christopher Wren. On the scroll beneath it, a line is carved: _Pereunt et imputantur_. The hours go by, and every one of them is charged to our account.

It took that sundial four years to teach QSD that sundials tend to carry a line of Latin. Each chapter of this page borrows its title from one.

What Palette does is, more or less, keep the books. Each photograph is first read as 24 points of colour, then pooled into five colours, each with its share; a whole voyage is reckoned the same way. [Rigi](/palette/#rigi) goes into the ledger as 38% deep blue, 25% grey-violet, 18% mist blue, 11% russet and 8% apricot. When a small patch of the frame is unusually vivid, unlike anything else in it, we mark it out on its own and call it the _accent_. It is often the colour the eye finds first: a shrine in a forest, a small curl of pink cloud in a blue sky above the snow.

{% include colour-figure.html kind="palette" voyage="rigi" %}

The next question was what to call each stroke. [{% include colour-code.html c="c4695d" %}](/reverie/?c=c4695d) is not a name, and _reddish-brown_ is barely illustrative.

What QSD found was a book from 1912: [_Color Standards and Color Nomenclature_](https://www.gutenberg.org/files/63087/63087-h/63087-h.htm), by the American ornithologist Robert Ridgway. Over more than twenty years, he gave names to 1,115 colours. As Ridgway says in the preface, without a standard, the naming of colour remains in its present condition of *absolute chaos*. QSD does not care for chaos.

{% include colour-code.html c="c4695d" %} has a name now: Cinnamon-Rufous. And [{% include colour-code.html c="2f3d59" %}](/reverie/?c=2f3d59) is Indulin Blue.

{% include colour-figure.html kind="chips" colours="c4695d 2f3d59" %}

Colours that fall too far from any of his go without a name. They are waiting for someone to claim them.

{% include colour-figure.html kind="chips" colours="326b8b" %}


## III. Horas non numero nisi serenas
{: lang="la"}
> *I count no hours but the serene.*
{: .gloss}

William Hazlitt has an essay, ["On a Sun-Dial"](http://essays.quotidiana.org/hazlitt/sun-dial/), that opens with this very line. It is, he tells us, the motto of a sundial near Venice, and he exclaims: "What a bland and care-dispelling feeling!"

Beautifully put. One thing was left out: the sundial has no choice. On a cloudy day there is no shadow, and it could not count the hours if it tried. Latin mottoes have a way of passing off a defect as a virtue.

If Lucerne had a sundial like that, it would have no memory of QSD. Over three visits, more than a week in all, he barely saw the sun.

The Swiss mountains are dotted with webcams, each pointed at the same peak around the clock. They mostly film fog, and hardly anyone looks. For a few days that December, we were among those few. Several times a day we checked how high the cloud sat and whether the ridge had broken through, as if reading someone else's sundial. QSD also spent a week catching up on geography with ChatGPT. He learned about the low pressure that settles over Switzerland in winter, and the name of every mountain around Lucerne.

On the day we set out, the Alpenglow app put the chance of an afterglow at 25%. Not a number that settles the nerves.

But everything that could be prepared had been. The rest was not ours to decide; we could only place the bet.

So we boarded the cogwheel train up the mountain.


## IV. Sine sole sileo
{: lang="la"}
> *Without the sun, I fall silent.*
{: .gloss}

{% include colour-figure.html kind="frames" voyage="rigi" frames="dscf5721 dscf5730 dscf5735 dscf5741 dscf5750 dscf5760 dscf5778 dscf5789" %}

There are eight photographs in [the Rigi album](/voyage/rigi/). The first six are all labelled _Golden hour_, which QSD's code defines as within 15 minutes of sunrise or sunset. In the last two, the sun has already sunk below the horizon: one is _Blue hour_, and the other has been written down as _Night_.

The angle of the sun writes out the hour. Eight photographs, running from a low, slanting sun to one already set. The album itself is a sundial.

Palette's colours follow the sun too. In the first three frames the accent is only a touch of warmth, between 3.6% and 3.9%. In the fourth, the sun slides down along the sea of clouds and the accent rises to 17.4%. By the fifth and sixth, cirrus that no forecast had promised is lit pink and violet, filling 62.8% and 52.5% of the frame. Only a small cluster of colour unlike all the rest is marked as the accent; once pink has spread across the whole sky, no colour is left that stands apart from the others. Those two photographs have no accent.

In Ridgway's book, that evening's afterglow is Old Rose, Deep Hyssop Violet and Eupatorium Purple. _Eupatorium_ is a wild herb, named for Mithridates VI Eupator, King of Pontus, who is said to have taken a little poison every day so that no poison could kill him. The name of an Alpine sunset goes the long way round and comes to rest on a king afraid of being poisoned. Ridgway probably never thought of any of this. He wrote his book for zoologists, botanists, pathologists and mineralogists.

{% include colour-figure.html kind="chips" colours="d27071 7f667f af7c9c" %}

A sundial cannot tell the time at night, and the Romans ran into that problem too. Five years after the faulty dial from Catania was superseded, Scipio Nasica set up Rome's first water clock. It told the hours by day and by night, and at last the Romans could know the time under a cloudy sky.

The code that works out the sun's angle is our water clock, in some sense. No shadow was left to read in the final photograph, yet the code knows exactly where the sun was: more than 6 degrees below the horizon. We label it _Night_.

{% include colour-figure.html kind="frame" voyage="rigi" frame="dscf5789" %}

## V. Ultima latet ut observentur omnes
{: lang="la"}
> *The last hour is hidden, so that we watch them all.*
{: .gloss}

The page that finds names for colours is called [Reverie](/reverie/). Open a colour and it gives you the nearest name in Ridgway, then every photograph that holds that colour.

{% include colour-figure.html kind="reverie" colour="ce7d99" %}

_Reverie_ comes from the Old French _resver_, which first meant to wander, or to rave; only later did it soften into _rêver_, to dream. That wandering is what QSD was after. Palette keeps its records by place. Reverie was meant to let us wander through memory, a single colour all the clue there is. Dusk in Prague can sit beside the afterglow on Rigi, years and countries apart. Further down the page is a row called _Nearby_: colours a step away from this one. Open any of them and you walk into another reverie.

Start from a patch of pink in the Rigi afterglow and you may wander to [{% include colour-code.html c="ce7d99" %}](/reverie/?c=ce7d99), which Ridgway calls Daphne Pink.

_Daphne_ is the botanical name for a genus of flowering shrubs. In Greek it means laurel. In Ovid's _Metamorphoses_, Daphne, a river god's daughter, is pursued by Apollo, god of the sun. Just as he is about to catch her, she prays to her father, and is turned into a laurel tree.

So behind this colour's name is someone running from the sun. And when it appeared, the sun had only just gone down.

It would be tempting to make something of this, but Ridgway has left a word of caution. As he says in the preface, his plates are "not to show the color of the particular objects or substances which the names suggest". Daphne Pink is not the pink of the daphne flower, and when he named it, he probably gave no thought to Daphne's story.

The archive now holds over six hundred photographs, yet the algorithm found no other pink like it. The nearest is [{% include colour-code.html c="ad6e89" %} Daphne Red](/reverie/?c=ad6e89), in an afterglow over Lake Bled. The mountains behind are lower, and the snow has all melted.

{% include colour-figure.html kind="chips" colours="ad6e89" %}

_QSD reveries in only this photograph… for now._
{: lang="en"}

</section>
</div>
