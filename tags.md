---
layout: default
permalink: /tags/
title: "Tags"
---

<section class="post-list">
{% for tag in site.tags %}

    {% capture tag_name %}{{ tag | first }}{% endcapture %}
    <h2 id="#{{ tag_name | slugize }}">{{ tag_name }}</h2>
    <a name="{{ tag_name | slugize }}"></a>
    {% for post in site.tags[tag_name] %}
<ul class="post-archives">
  {% include archive-single.html %}
</ul>
    {% endfor %}

{% endfor %}
</section>
