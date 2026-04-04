import SectionTitle from "@/Components/SectionTitle";

export default function post(backend) {
    const { post } = backend.props

    return (
        <div className="page grid grid-cols-12" >
            <section id="Post">
                <h2 className="postTitle">
                    {post.title}
                </h2>
                <div className="postContent">
                    {post.content}
                </div>
                <div className="relatedePosts">

                </div>
            </section>
        </div>
    );
}