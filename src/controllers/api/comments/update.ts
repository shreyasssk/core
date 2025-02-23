import pg from "db/pg";
import { isNil } from "lodash";
import { relationDao } from "container";
import type { Request, Response } from "express";

// For updating a comment
const update = async (req: Request, res: Response) => {
  // Getting the updated body
  const { body } = req.body;
  // Getting some parameters
  const { post: postId, comment: commentId } = req.params;

  // Checking if the post exists
  const post = await pg.getFirst<{ user_id: string }>(
    "SELECT user_id FROM posts WHERE id = $1",
    [postId]
  );

  if (!isNil(post)) {
    // Checking if the other user has blocked current user
    const status = await relationDao.getRelationByUserIds(
      post.user_id,
      req.user?.id!
    );
    if (status === "BLOCKED") return res.sendStatus(403);

    const comment = await pg.getFirst<{ user_id: string }>(
      "SELECT user_id FROM comments WHERE id = $1",
      [commentId]
    );

    // If comment exists
    if (!isNil(comment)) {
      // If the author of the comment is the same as current user
      if (comment.user_id === req.user?.id) {
        // Update the comment
        const comment = await pg.getFirst<Partial<Comment>>(
          "UPDATE comments SET body = $1 WHERE id = $2 RETURNING *",
          [body, commentId]
        );

        // Send the updated comment
        return res.json(comment);
      }

      // If the author is not the same
      return res.sendStatus(403);
    }

    // If the comment doesn't exist
    return res.sendStatus(404);
  }

  // If the post doesn't exist
  return res.sendStatus(404);
};

export default update;
