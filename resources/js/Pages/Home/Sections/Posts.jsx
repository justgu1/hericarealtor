import SectionTitle from "@/Components/SectionTitle";

export default function Posts({ posts }) {
    return (
        <section id="Posts" className="postsSection relative">
            <SectionTitle h2="In the" h3="Media" color="darkness" />
            <div className="flex flex-col justify-between md:flex-row gap-4">
                <article className="scrollingArticle">
                    <p className="text-bv-black text-lg md:text-xl xl:text-3xl">
                        We know that finding the perfect home for your family is a special journey. That’s why we keep our blog up to date with information about what to expect from our properties and the surrounding area, helping you make the best decision for your future home.
                    </p>
                </article>
                <div className="homePosts">
                    {posts.map((post, index) => (
                        <article key={post.id} className="post">
                                {index % 2 === 0 ? (
                                    <>
                                        <figure className="left">
                                            <img className="postThumbnail" src={post.thumbnail_url} alt={post.title} />
                                        </figure>
                                        <div className="right postData">
                                            <h2 className="postTitle">{post.title}</h2>
                                            <div className="postContent" dangerouslySetInnerHTML={{ __html: post.content }} />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="left postData">
                                            <h2 className="postTitle">{post.title}</h2>
                                            <div className="postContent" dangerouslySetInnerHTML={{ __html: post.content }} />
                                        </div>
                                        <figure className="right">
                                            <img className="postThumbnail" src={post.thumbnail_url} alt={post.title} />

                                        </figure>
                                    </>
                                )}
                            </article>
                        ))}

                </div>
            </div>
        </section>
    );
}