import basket_icon from './basket_icon.png'
import logo from './logo.png'
import header_img from './header_img.png'
import search_icon from './search_icon.png'
import menu_1 from './menu_1.png'
import menu_2 from './menu_2.png'
import menu_3 from './menu_3.png'
import menu_4 from './menu_4.png'
import menu_5 from './menu_5.png'
import menu_6 from './menu_6.png'
import menu_7 from './menu_7.png'
import menu_8 from './menu_8.png'

import food_1 from './food_1.png'
import food_2 from './food_2.png'
import food_3 from './food_3.png'
import food_4 from './food_4.png'
import food_5 from './food_5.png'
import food_6 from './food_6.png'
import food_7 from './food_7.png'
import food_8 from './food_8.png'
import food_9 from './food_9.png'
import food_10 from './food_10.png'
import food_11 from './food_11.png'
import food_12 from './food_12.png'
import food_13 from './food_13.png'
import food_14 from './food_14.png'
import food_15 from './food_15.png'
import food_16 from './food_16.png'
import food_17 from './food_17.png'
import food_18 from './food_18.png'
import food_19 from './food_19.png'
import food_20 from './food_20.png'
import food_21 from './food_21.png'
import food_22 from './food_22.png'

import add_icon_white from './add_icon_white.png'
import add_icon_green from './add_icon_green.png'
import remove_icon_red from './remove_icon_red.png'
import app_store from './app_store.png'
import play_store from './play_store.png'
import linkedin_icon from './linkedin_icon.png'
import facebook_icon from './facebook_icon.png'
import twitter_icon from './twitter_icon.png'
import cross_icon from './cross_icon.png'
import selector_icon from './selector_icon.png'
import rating_starts from './rating_starts.png'
import profile_icon from './profile_icon.png'
import bag_icon from './bag_icon.png'
import logout_icon from './logout_icon.png'
import parcel_icon from './parcel_icon.png'

export const assets = {
    logo,
    basket_icon,
    header_img,
    search_icon,
    rating_starts,
    add_icon_green,
    add_icon_white,
    remove_icon_red,
    app_store,
    play_store,
    linkedin_icon,
    facebook_icon,
    twitter_icon,
    cross_icon,
    selector_icon,
    profile_icon,
    logout_icon,
    bag_icon,
    parcel_icon
}

export const menu_list = [
    {
        menu_name: "RAM",
        menu_image: menu_1
    },
    {
        menu_name: "SSD",
        menu_image: menu_2
    },
    {
        menu_name: "HDD",
        menu_image: menu_3
    },
    {
        menu_name: "BATTERY",
        menu_image: menu_4
    },
    {
        menu_name: "LCD DISPLAY",
        menu_image: menu_5
    },
    {
        menu_name: "KEYBOARD",
        menu_image: menu_6
    },
    {
        menu_name: "SPEAKER",
        menu_image: menu_7
    },
    {
        menu_name: "LAPTOP SECOND",
        menu_image: menu_8
    }
]

export const food_list = [
    {
        _id: "1",
        name: "DDR4 8GB 3200MHz Laptop RAM",
        image: food_1,
        price: 25,
        description: "High-speed DDR4 SO-DIMM memory module for smooth multitasking and laptop upgrade.",
        category: "RAM"
    },
    {
        _id: "2",
        name: "DDR4 16GB 3200MHz Desktop RAM",
        image: food_2,
        price: 45,
        description: "Reliable performance desktop memory with heat spreader for gaming and office PCs.",
        category: "RAM"
    },
    {
        _id: "3",
        name: "DDR5 16GB 4800MHz Laptop RAM",
        image: food_3,
        price: 60,
        description: "Next-generation ultra-fast DDR5 memory for modern laptops.",
        category: "RAM"
    },
    {
        _id: "4",
        name: "NVMe M.2 SSD 512GB Gen4",
        image: food_4,
        price: 48,
        description: "Ultra-fast boot times and rapid file transfers up to 3500MB/s read speed.",
        category: "SSD"
    },
    {
        _id: "5",
        name: "SATA III 2.5-inch SSD 256GB",
        image: food_5,
        price: 28,
        description: "Upgrade your older laptop or desktop for instant speed improvement.",
        category: "SSD"
    },
    {
        _id: "6",
        name: "NVMe M.2 SSD 1TB High Speed",
        image: food_6,
        price: 85,
        description: "Large capacity high-speed NVMe storage for video editing and heavy software.",
        category: "SSD"
    },
    {
        _id: "7",
        name: "1TB 2.5-inch Internal Laptop HDD",
        image: food_7,
        price: 42,
        description: "5400RPM reliable internal hard drive for mass data and media backup.",
        category: "HDD"
    },
    {
        _id: "8",
        name: "2TB 3.5-inch Desktop Hard Drive",
        image: food_8,
        price: 58,
        description: "7200RPM high-capacity desktop storage drive for PC and CCTV systems.",
        category: "HDD"
    },
    {
        _id: "9",
        name: "Dell Inspiron / Latitude Replacement Battery",
        image: food_9,
        price: 38,
        description: "Long-lasting 4-cell Li-ion replacement battery with overcharge protection.",
        category: "BATTERY"
    },
    {
        _id: "10",
        name: "HP Pavilion / ProBook Original Battery",
        image: food_10,
        price: 40,
        description: "High-capacity replacement battery for HP laptops with 6-month warranty.",
        category: "BATTERY"
    },
    {
        _id: "11",
        name: "Lenovo ThinkPad / IdeaPad Battery",
        image: food_11,
        price: 42,
        description: "Durable grade-A cells replacement battery for Lenovo notebooks.",
        category: "BATTERY"
    },
    {
        _id: "12",
        name: "15.6-inch FHD IPS Laptop Screen (30-Pin)",
        image: food_12,
        price: 75,
        description: "1920x1080 Full HD matte anti-glare replacement display panel.",
        category: "LCD DISPLAY"
    },
    {
        _id: "13",
        name: "14.0-inch HD Slim Laptop Display",
        image: food_13,
        price: 62,
        description: "Slim LED replacement screen compatible with most 14-inch laptops.",
        category: "LCD DISPLAY"
    },
    {
        _id: "14",
        name: "15.6-inch 144Hz Gaming Laptop Display",
        image: food_14,
        price: 110,
        description: "High refresh rate IPS replacement panel for smooth gaming visuals.",
        category: "LCD DISPLAY"
    },
    {
        _id: "15",
        name: "Dell / HP Replacement Laptop Keyboard",
        image: food_15,
        price: 22,
        description: "US layout tactile replacement keyboard with smooth key travel.",
        category: "KEYBOARD"
    },
    {
        _id: "16",
        name: "Backlit Gaming Laptop Replacement Keyboard",
        image: food_16,
        price: 35,
        description: "LED backlit keyboard replacement for night typing and gaming.",
        category: "KEYBOARD"
    },
    {
        _id: "17",
        name: "Internal Laptop Stereo Speaker Set",
        image: food_17,
        price: 18,
        description: "Clear left and right replacement internal speakers for laptops.",
        category: "SPEAKER"
    },
    {
        _id: "18",
        name: "USB Mini Desktop Stereo Speaker",
        image: food_18,
        price: 15,
        description: "Compact USB-powered external speaker with rich bass for PC and laptop.",
        category: "SPEAKER"
    },
    {
        _id: "19",
        name: "Dell Latitude 7490 (Core i7 8th Gen)",
        image: food_19,
        price: 320,
        description: "16GB RAM, 512GB NVMe SSD, 14-inch FHD Display, 95% Clean Grade-A Second.",
        category: "LAPTOP SECOND"
    },
    {
        _id: "20",
        name: "Lenovo ThinkPad T480 (Core i5 8th Gen)",
        image: food_20,
        price: 280,
        description: "8GB RAM, 256GB SSD, Durable business laptop in excellent condition.",
        category: "LAPTOP SECOND"
    },
    {
        _id: "21",
        name: "HP EliteBook 840 G6 (Core i5 8th Gen)",
        image: food_21,
        price: 310,
        description: "16GB RAM, 512GB SSD, Aluminum body slim business notebook.",
        category: "LAPTOP SECOND"
    },
    {
        _id: "22",
        name: "MacBook Pro 2019 13-inch (Touch Bar)",
        image: food_22,
        price: 550,
        description: "Core i5, 8GB RAM, 256GB SSD, Retina Display, Good battery cycle count.",
        category: "LAPTOP SECOND"
    }
];
