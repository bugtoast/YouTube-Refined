/** Finds and removes YouTube's "Explore more topics" feed sections. */
(function (global) {
  const YTC = (global.YTC = global.YTC || {});

  const HEADING_ELEMENTS = 'h1, h2, h3, [role="heading"], yt-section-header-view-model, #title';
  const SECTION_CONTAINERS = [
    'ytd-rich-section-renderer',
    'grid-shelf-view-model',
    'ytd-item-section-renderer',
    'ytd-rich-shelf-renderer',
    'ytd-shelf-renderer',
  ];

  function isExploreMoreTopics(element) {
    return (element.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase() === 'explore more topics';
  }

  function removeSection(section) {
    if (!section || !section.isConnected) return false;
    try {
      section.remove();
    } catch {
      section.style.setProperty('display', 'none', 'important');
      section.setAttribute('aria-hidden', 'true');
    }
    return true;
  }

  function sectionForHeading(heading) {
    for (const selector of SECTION_CONTAINERS) {
      const section = heading.closest(selector);
      if (section) return section;
    }
    return null;
  }

  function removeExploreMoreTopics(root) {
    if (!root || root.nodeType !== 1) return 0;
    let removed = 0;
    const headings = [];

    if (root.matches(HEADING_ELEMENTS)) headings.push(root);
    headings.push(...root.querySelectorAll(HEADING_ELEMENTS));

    for (const heading of headings) {
      if (!isExploreMoreTopics(heading)) continue;
      const section = sectionForHeading(heading);
      if (removeSection(section)) removed += 1;
    }

    return removed;
  }

  YTC.topics = { removeExploreMoreTopics };
})(window);
