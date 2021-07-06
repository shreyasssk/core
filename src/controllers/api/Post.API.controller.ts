import { sql } from "slonik";
import Express from "express";
import slonik from "../../db/slonik";
// import minio from "../../db/minio";
import textCleaner from "../../helpers/textCleaner";

export const fetchOne = async (req: Express.Request, res: Express.Response) => {
  const { post: postId } = req.params;

  const {
    rows: { 0: post },
  } = await slonik.query(sql`
      SELECT 
        post.id, 
        post.body, 
        post.privacy, 
        post.created_at, 
        row_to_json(author) AS user,
        json_agg(comments) AS comments

      FROM posts post
        LEFT OUTER JOIN 
          (SELECT first_name, last_name, avatar, id, username FROM users) author
            ON post.user_id = author.id

        LEFT OUTER JOIN comments ON comments.post_id = post.id

      WHERE post.id = ${postId.toString()} GROUP BY post.id, author.* ORDER BY post.created_at DESC;
  `);

  if (post) return res.json(post);
  else return res.status(403).send();
};

export const fetch = async (req: Express.Request, res: Express.Response) => {
  const { account: accountId } = req.query;

  if (!accountId) {
    const { rows: posts } = await slonik.query(sql`
      SELECT 
        post.id, 
        post.body, 
        post.privacy, 
        post.created_at, 
        row_to_json(author) AS user,
        json_agg(comments) AS comments

      FROM posts post
        LEFT OUTER JOIN 
          (SELECT first_name, last_name, avatar, id, username FROM users) author
            ON post.user_id = author.id
        
        LEFT OUTER JOIN comments ON comments.post_id = post.id

      WHERE author.id <> ${req.user
        ?.id!!} GROUP BY post.id, author.* ORDER BY post.created_at DESC;
    `);

    return res.json(posts);
  } else {
    // ! TODO: Only allow public user's public posts to be discovered
    const posts = await slonik.query(sql`
      SELECT 
        post.id, 
        post.body, 
        post.privacy, 
        post.created_at, 
        row_to_json(author) AS user,
        json_agg(comments) AS comments

      FROM posts post
        JOIN 
          (SELECT first_name, last_name, avatar, id, username FROM users) author
            ON post.user_id = author.id
        
        JOIN comments ON comments.post_id = post.id

      GROUP BY post.id, author.* ORDER BY post.created_at DESC;
    `);

    return res.json(posts.rows);
  }
};

export const create = async (req: Express.Request, res: Express.Response) => {
  // If no text is present prevent the user from posting
  if (!req.body.text) return res.status(401).send();
  else {
    // Post text
    const text = textCleaner(req.body.text);

    // Checking if there are no uploaded files
    if (req.files?.length === 0) {
      // Create new post
      const post = await slonik.query(sql`
        INSERT INTO posts (body, user_id)
        VALUES (${text}, ${req.user?.id!!})
        RETURNING *;
      `);

      // Sending the response
      return res.json(post.rows[0]);
    } else {
      // TODO: Needs to be implemented
    }
  }
};

// For removing a post
export const remove = async (req: Express.Request, res: Express.Response) => {
  try {
    // Getting post id from the query
    const { id } = req.params;
    // Deleting from the database
    const {
      rows: { 0: post },
    } = await slonik.query(sql`
      SELECT * FROM posts WHERE id = ${id.toString()};
    `);

    // Checking if the post exists
    if (post) {
      // If the author of the post is the same as current user
      if (post?.user_id === req.user?.id) {
        await slonik.query(sql`
        DELETE FROM posts WHERE id = ${id.toString()};
      `);
        // Sending "No content response"
        return res.status(204).send();
      } else return res.status(403).send();
    } else return res.status(404).send();
  } catch (error) {
    console.error(error);
    return res.status(500).send();
  }
};
