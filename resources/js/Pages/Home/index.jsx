import { Head } from "@inertiajs/react";
import FeaturedListings from "./Sections/FeaturedListings";
import MyIntroduction from "./Sections/MyIntroduction";
import ConciergeService from "./Sections/ConciergeService";
import UtilsLinksSection from "./Sections/UtilsLinksSection";
import OurNumbers from "./Sections/OurNumbers";
import Posts from "./Sections/Posts";
import Reviews from "./Sections/Reviews";
import Leadform from "./Sections/LeadForm";
import Areas from "./Sections/Areas";
import FadeInWhenVisible from "@/Components/FadeInWhenVisible";
export default function Home(data) {
    const listings = data.props.listings
    const posts = data.props.posts
    const reviews = data.props.reviews
    const listingTypes = data.props.listingTypes
    return (
        <div className="page grid grid-cols-12 overflow-hidden">
            <Head title="Home" />
            <FadeInWhenVisible>
                <Areas listings={listings} />
            </FadeInWhenVisible>
            <FadeInWhenVisible>
                <FeaturedListings listings={listings} />
            </FadeInWhenVisible>
            <FadeInWhenVisible>
                <MyIntroduction />
            </FadeInWhenVisible>
            <FadeInWhenVisible>
                <ConciergeService />
            </FadeInWhenVisible>
            <FadeInWhenVisible>
                <UtilsLinksSection />
            </FadeInWhenVisible>
            <FadeInWhenVisible>
                <OurNumbers />
            </FadeInWhenVisible>

            {posts.length > 0 ?
                <FadeInWhenVisible>
                    <Posts posts={posts} />
                </FadeInWhenVisible>
                : ''}


            {reviews.length > 0 ?
                <FadeInWhenVisible>
                    <Reviews reviews={reviews} />
                </FadeInWhenVisible>
                : ''}

            <FadeInWhenVisible>
                <Leadform />
            </FadeInWhenVisible>
        </div>
    );
}