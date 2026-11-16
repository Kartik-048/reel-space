export interface TopicDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  related_topics: string[];
  bridge_topics?: Record<string, string>; // e.g. { 'Photography': 'Astrophotography' }
  keywords: string[];
}

export const TOPIC_TAXONOMY: Record<string, TopicDefinition> = {
  Astronomy: {
    id: 'astronomy',
    name: 'Astronomy',
    category: 'Science',
    description: 'Celestial bodies, stars, galaxies, and the mysteries of the universe',
    related_topics: ['Space Exploration', 'Science', 'Astrophotography', 'Physics'],
    bridge_topics: {
      Photography: 'Astrophotography',
      Technology: 'Space Exploration',
      Science: 'Astrophysics',
    },
    keywords: ['astronomy', 'stars', 'galaxy', 'universe', 'telescope', 'jameswebb', 'hubble', 'nebula', 'cosmos', 'stargazing', 'milkyway', 'planet', 'mars', 'blackhole'],
  },
  'Space Exploration': {
    id: 'space_exploration',
    name: 'Space Exploration',
    category: 'Science',
    description: 'Rockets, NASA, Artemis, SpaceX missions, and deep space probes',
    related_topics: ['Astronomy', 'Technology', 'Science', 'Engineering'],
    bridge_topics: {
      Technology: 'Rocket Engineering',
      Astronomy: 'Cosmology',
    },
    keywords: ['space', 'spacex', 'nasa', 'rocket', 'artemis', 'iss', 'astronaut', 'orbit', 'launch', 'starship', 'rover'],
  },
  Astrophotography: {
    id: 'astrophotography',
    name: 'Astrophotography',
    category: 'Creative Tech',
    description: 'Capturing the night sky, deep space objects, and long-exposure starry vistas',
    related_topics: ['Astronomy', 'Photography', 'Cinematography', 'Science'],
    bridge_topics: {
      Technology: 'Camera Sensors',
      Nature: 'Nightscapes',
    },
    keywords: ['astrophotography', 'nightsky', 'milkywaychasers', 'deepsky', 'longexposure', 'starrynight', 'nightphotography', 'telescopephotography'],
  },
  Technology: {
    id: 'technology',
    name: 'Technology',
    category: 'Tech & Gadgets',
    description: 'Hardware, software, computing innovations, gadgets, and silicon breakthroughs',
    related_topics: ['AI & Machine Learning', 'Coding & Dev', 'Gadgets', 'Science'],
    bridge_topics: {
      Astronomy: 'Space Exploration',
      Design: 'Creative Tech',
      Gaming: 'PC Hardware',
      Photography: 'Camera Sensors',
    },
    keywords: ['technology', 'tech', 'gadgets', 'hardware', 'software', 'silicon', 'apple', 'smartphone', 'futuretech', 'innovation', 'engineering'],
  },
  'AI & Machine Learning': {
    id: 'ai_ml',
    name: 'AI & Machine Learning',
    category: 'Tech & Gadgets',
    description: 'Neural networks, generative AI, LLMs, computer vision, and robotics',
    related_topics: ['Technology', 'Coding & Dev', 'Science', 'Robotics'],
    bridge_topics: {
      Photography: 'Computational Photography',
      Design: 'Generative Art',
    },
    keywords: ['ai', 'machinelearning', 'deeplearning', 'chatgpt', 'artificialintelligence', 'neuralnetwork', 'llm', 'robotics', 'datascience'],
  },
  Photography: {
    id: 'photography',
    name: 'Photography',
    category: 'Arts & Media',
    description: 'Composition, lighting, lenses, camera gear, and visual storytelling',
    related_topics: ['Cinematography', 'Astrophotography', 'Design & Art', 'Nature & Wildlife'],
    bridge_topics: {
      Astronomy: 'Astrophotography',
      Technology: 'Camera Gear',
      Nature: 'Wildlife Photography',
    },
    keywords: ['photography', 'photo', 'camera', 'lens', 'lighting', 'portrait', 'streetphotography', 'visuals', 'sonyalpha', 'fujifilm', 'shutter'],
  },
  Cinematography: {
    id: 'cinematography',
    name: 'Cinematography',
    category: 'Arts & Media',
    description: 'Color grading, camera movement, movie visual direction, and storytelling',
    related_topics: ['Photography', 'Design & Art', 'Directing', 'Sound Design'],
    keywords: ['cinematography', 'filmmaking', 'colorgrading', 'cinematic', 'director', 'videography', 'davinciresolve', 'anamorphic', 'framing'],
  },
  Gaming: {
    id: 'gaming',
    name: 'Gaming',
    category: 'Entertainment',
    description: 'Video games, gameplay highlights, game design, and esports',
    related_topics: ['Technology', 'Comedy', 'Game Dev', 'Animation'],
    bridge_topics: {
      Technology: 'PC Hardware',
      Comedy: 'Gaming Fails',
      Design: 'Game Design',
    },
    keywords: ['gaming', 'gamer', 'gameplay', 'playstation', 'xbox', 'nintendo', 'steam', 'esports', 'videogames', 'rpg', 'fps', 'speedrun'],
  },
  Comedy: {
    id: 'comedy',
    name: 'Comedy',
    category: 'Entertainment',
    description: 'Sketches, parodies, observational humor, and witty relatable clips',
    related_topics: ['Entertainment', 'Gaming', 'Daily Life', 'Satire'],
    keywords: ['comedy', 'funny', 'humor', 'skit', 'lol', 'relatable', 'meme', 'jokes', 'hilarious', 'sketch', 'parody'],
  },
  'Nature & Wildlife': {
    id: 'nature_wildlife',
    name: 'Nature & Wildlife',
    category: 'Environment',
    description: 'Oceans, forests, rare animal encounters, macro flora, and planet Earth',
    related_topics: ['Science', 'Photography', 'Environment', 'Exploration'],
    bridge_topics: {
      Photography: 'Wildlife Photography',
      Science: 'Biology',
    },
    keywords: ['nature', 'wildlife', 'animals', 'ocean', 'forest', 'earth', 'mountains', 'planetearth', 'conservation', 'macro'],
  },
  'Coding & Dev': {
    id: 'coding_dev',
    name: 'Coding & Dev',
    category: 'Tech & Gadgets',
    description: 'Web development, system design, tips for software engineers, and architecture',
    related_topics: ['Technology', 'AI & Machine Learning', 'Productivity'],
    keywords: ['coding', 'programming', 'developer', 'softwareengineer', 'javascript', 'python', 'react', 'webdev', 'frontend', 'backend', 'devlife'],
  },
  'Design & Art': {
    id: 'design_art',
    name: 'Design & Art',
    category: 'Arts & Media',
    description: 'Graphic design, 3D rendering, typography, motion graphics, and UI/UX',
    related_topics: ['Cinematography', 'Photography', 'Technology', 'Architecture'],
    keywords: ['design', 'graphicdesign', 'uiux', 'art', '3dart', 'blender3d', 'typography', 'motiongraphics', 'visualarts', 'illustration'],
  },
};

/**
 * Classifies raw text (caption + hashtags) into primary and secondary topics.
 */
export function classifyContent(caption: string, hashtags: string[] = []): {
  primary_topic: string;
  secondary_topics: string[];
} {
  const normalizedText = `${caption} ${hashtags.join(' ')}`.toLowerCase();
  const topicScores: Record<string, number> = {};

  for (const [topicName, def] of Object.entries(TOPIC_TAXONOMY)) {
    let score = 0;
    // Check keywords
    for (const kw of def.keywords) {
      if (normalizedText.includes(kw.toLowerCase())) {
        score += 2;
      }
    }
    // Check hashtags explicitly
    for (const tag of hashtags) {
      const cleanTag = tag.replace(/^#/, '').toLowerCase();
      if (def.keywords.includes(cleanTag) || topicName.toLowerCase() === cleanTag) {
        score += 4;
      }
    }
    if (score > 0) {
      topicScores[topicName] = score;
    }
  }

  const sorted = Object.entries(topicScores).sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    return {
      primary_topic: 'Technology',
      secondary_topics: ['Science', 'Innovation'],
    };
  }

  const primary_topic = sorted[0][0];
  const secondary_topics = sorted.slice(1, 4).map(([t]) => t);

  // If no secondaries found, add from taxonomy related
  if (secondary_topics.length === 0 && TOPIC_TAXONOMY[primary_topic]?.related_topics) {
    secondary_topics.push(...TOPIC_TAXONOMY[primary_topic].related_topics.slice(0, 2));
  }

  return { primary_topic, secondary_topics };
}

/**
 * Find smart exploration bridge topics between two user interests.
 * e.g. User likes Astronomy and Photography -> returns Astrophotography!
 */
export function findBridgeTopic(topicA: string, topicB: string): string | null {
  const defA = TOPIC_TAXONOMY[topicA];
  if (defA?.bridge_topics && defA.bridge_topics[topicB]) {
    return defA.bridge_topics[topicB];
  }
  const defB = TOPIC_TAXONOMY[topicB];
  if (defB?.bridge_topics && defB.bridge_topics[topicA]) {
    return defB.bridge_topics[topicA];
  }
  return null;
}
