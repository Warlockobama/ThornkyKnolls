// Post Loader - Fetches posts.json and filters by animal
async function loadAnimalPosts(animalId) {
  const container = document.getElementById('animalPosts');

  if (!container) {
    console.error('Container #animalPosts not found');
    return;
  }

  try {
    // Fetch the posts data
    const response = await fetch('../../data/posts.json');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Filter posts that feature this animal
    const animalPosts = data.posts.filter(post =>
      post.animals.includes(animalId)
    );

    // Display results
    if (animalPosts.length === 0) {
      container.innerHTML = `
        <p class="font-book text-gray-500 italic">
          No stories yet featuring this animal. Check back soon!
        </p>
      `;
      return;
    }

    // Render post list
    container.innerHTML = animalPosts.map(post => `
      <div class="border-l-4 border-purple-400 pl-4 py-2 hover:bg-purple-50 transition-colors">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <a href="../../${post.url}" class="font-story text-lg text-purple-700 hover:text-purple-900 transition-colors">
              ${post.title}
            </a>
            <p class="font-book text-sm text-gray-600 mt-1">
              ${post.excerpt}
            </p>
          </div>
          <span class="font-hand text-sm text-gray-500 ml-4 whitespace-nowrap">
            ${formatDate(post.date)}
          </span>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error loading posts:', error);
    container.innerHTML = `
      <p class="font-book text-red-600">
        Unable to load stories. Please try again later.
      </p>
    `;
  }
}

// Format date helper
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}
