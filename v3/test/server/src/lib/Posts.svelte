<script lang="ts">
  let { userId, postId } = $props<{ userId?: string; postId?: string }>();
</script>

<div data-testid="posts-component">
  <h1>Posts</h1>
  {#if userId && postId}
    <p data-testid="post-params">User: {userId}, Post: {postId}</p>
  {:else if userId}
    <p data-testid="user-posts">All posts for user: {userId}</p>
  {:else}
    <p>All posts</p>
  {/if}
</div>
