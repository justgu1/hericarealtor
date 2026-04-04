import SectionTitle from "@/Components/SectionTitle";
import LeadsForm from "../Home/Sections/LeadForm";
import FadeInWhenVisible from "@/Components/FadeInWhenVisible";
import { MdKeyboardDoubleArrowLeft, MdKeyboardDoubleArrowRight } from "react-icons/md";
import { Head, usePage } from "@inertiajs/react";
export default function blog(backend) {
    const { posts } = backend.props;
    const pagination = posts.pagination
    const { url } = usePage();

    const currentPage = pagination.current_page;

    const isActive = (page) => {
        return url.includes(`?page=${page}`) || (!url.includes("?page=") && page === 1);
    };

    return (
        <div className="page grid grid-cols-12 overflow-hidden">
            <Head title="Blog" />
            <section id="Blog">
                <SectionTitle h2="Welcome to my" h3="Blog" color="darkness" />
                {
                    posts.items.length > 0 ? (
                        <div className="postsLooping">
                            {posts.items.map((post, index) => (
                                <FadeInWhenVisible>
                                    <a href="#" key={post.id}>
                                        <article className="post">
                                            {index % 2 === 0 ? (
                                                <>
                                                    <figure className="left postFigure">
                                                        <img
                                                            className="postThumbnail"
                                                            src={post.thumbnail_url || 'img/default.jpg'}
                                                            alt={post.title}
                                                        />
                                                    </figure>
                                                    <div className="right postData lg:rounded-r-2xl">
                                                        <div className="categories">
                                                            {post.categories.map((category) => (
                                                                <a
                                                                    key={category.id}
                                                                    href="#"
                                                                    className="category">
                                                                    {category.name}
                                                                </a>
                                                            ))}
                                                        </div>
                                                        <h2 className="postTitle">{post.title}</h2>
                                                        <div className="postContent" dangerouslySetInnerHTML={{ __html: post.content }} />
                                                        <div className="tags">
                                                            {post.tags.map((tag) => (
                                                                <span
                                                                    key={tag.id}
                                                                    className="tag">
                                                                    {tag.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="left postData lg:rounded-l-2xl">
                                                        <div className="categories">
                                                            {post.categories.map((category) => (
                                                                <a
                                                                    key={category.id}
                                                                    href="#"
                                                                    className="category">
                                                                    {category.name}
                                                                </a>
                                                            ))}
                                                        </div>
                                                        <h2 className="postTitle">{post.title}</h2>
                                                        <div className="postContent" dangerouslySetInnerHTML={{ __html: post.content }} />
                                                        <div className="tags">
                                                            {post.tags.map((tag) => (
                                                                <span
                                                                    key={tag.id}
                                                                    className="tag">
                                                                    {tag.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <figure className="right postFigure">
                                                        <img className="postThumbnail" src={post.thumbnail_url} alt={post.title} />
                                                    </figure>
                                                </>
                                            )}
                                        </article>
                                    </a>
                                </FadeInWhenVisible>
                            ))}
                        </div>
                    ) : (
                        <span className="text-bv-black text-lg m-auto">Sorry, we don't have new posts...</span>
                    )
                }
                <div className="pagination flex items-center gap-2 justify-center mt-4">
                    <a
                        href={`${route("blog", { page: 1 })}`}
                        className={`FirstPageButton button ${currentPage === 1 ? "opacity-20 pointer-events-none" : ""}`}
                    >
                        <MdKeyboardDoubleArrowLeft />
                    </a>

                    {currentPage === 1 && (
                        <a
                            href={`${route("properties", { page: pagination.last_page })}`}
                            className="button paginationButton"
                        >
                            {pagination.last_page}
                        </a>
                    )}

                    {currentPage > 1 && (
                        <a
                            href={`${route("properties", { page: currentPage - 1 })}`}
                            className="button paginationButton"
                        >
                            {currentPage - 1}
                        </a>
                    )}

                    <a
                        href={`${route("properties", { page: currentPage })}`}
                        className={`button paginationButton ${isActive(currentPage) ? "current" : ""}`}
                    >
                        {currentPage}
                    </a>

                    {currentPage < pagination.last_page && (
                        <a
                            href={`${route("properties", { page: currentPage + 1 })}`}
                            className="button paginationButton"
                        >
                            {currentPage + 1}
                        </a>
                    )}

                    {currentPage === pagination.last_page && (
                        <a
                            href={`${route("properties", { page: 1 })}`}
                            className="button paginationButton"
                        >
                            1
                        </a>
                    )}

                    <a
                        href={`${route("properties", { page: pagination.last_page })}`}
                        className={`LastPageButton button ${currentPage === pagination.last_page ? "opacity-20 pointer-events-none" : ""}`}
                    >
                        <MdKeyboardDoubleArrowRight />
                    </a>
                </div>
            </section>
            <FadeInWhenVisible>
                <LeadsForm />
            </FadeInWhenVisible>
        </div>
    );
}
