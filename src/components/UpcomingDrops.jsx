import React from 'react';
import { banners, upcomingDropsSchedule } from '../data/storeData';
import { Calendar, Bell, Clock, ChevronRight } from 'lucide-react';

export default function UpcomingDrops({ onNotifyMe }) {
  const { uncapped } = banners;

  return (
    <section id="upcoming-drops" className="py-14 sm:py-20 px-4 lg:px-8 max-w-[1440px] mx-auto border-b border-[#222222]">
      
      {/* Uncapped Promo Banner */}
      <div className="relative w-full rounded-lg overflow-hidden border border-[#2b2b2b] mb-12 group cursor-pointer">
        <img 
          src={uncapped.img} 
          alt={uncapped.title} 
          className="w-full h-auto max-h-[360px] object-cover group-hover:scale-102 transition-transform duration-700 brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent flex items-center p-6 sm:p-12">
          <div className="max-w-[550px]">
            <span className="bg-[#2563eb] text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded tracking-widest inline-block mb-3">
              {uncapped.tag}
            </span>
            <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-2">
              {uncapped.title}
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 mb-6">
              {uncapped.desc}
            </p>
            <button 
              onClick={() => onNotifyMe && onNotifyMe('Upcoming Drops VIP Access')}
              className="btn-primary text-xs sm:text-sm py-2 px-5"
            >
              <span>{uncapped.ctaText}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Release Calendar Header */}
      <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#262626]">
        <div>
          <div className="flex items-center gap-1.5 text-[#ffaa00] font-bold text-xs uppercase tracking-widest mb-1">
            <Calendar size={14} />
            <span>RELEASE SCHEDULE</span>
          </div>
          <h3 className="font-display text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
            DROP CALENDAR
          </h3>
        </div>
        <div className="hidden sm:block text-xs text-gray-400 font-medium">
          Times shown in Eastern Time (ET). Drops go live at exact designated hour.
        </div>
      </div>

      {/* Drops Schedule Timeline */}
      <div className="space-y-4">
        {upcomingDropsSchedule.map((drop) => (
          <div 
            key={drop.id}
            className="bg-[#141414] border border-[#242424] hover:border-[#383838] rounded-md p-5 sm:p-6 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            {/* Date & Time Column */}
            <div className="flex md:flex-col items-center md:items-start justify-between md:justify-center min-w-[200px] border-b md:border-b-0 md:border-r border-[#262626] pb-3 md:pb-0 md:pr-6">
              <div className="font-display text-lg sm:text-xl font-black text-white uppercase tracking-wide">
                {drop.date}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#ff3b30]">
                <Clock size={13} />
                <span>{drop.time}</span>
              </div>
            </div>

            {/* Drop Description Column */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <h4 className="font-display text-base sm:text-lg font-black text-white uppercase tracking-wide">
                  {drop.title}
                </h4>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${
                  drop.badge === 'HIGH DEMAND' 
                    ? 'bg-[#e10600] text-white' 
                    : (drop.badge === 'FLAGSHIP EXCLUSIVE' ? 'bg-[#2563eb] text-white' : 'bg-[#242424] text-gray-300 border border-[#383838]')
                }`}>
                  {drop.badge}
                </span>
              </div>
              
              <div className="text-xs font-bold text-gray-300 mb-1">
                Teams: <span className="text-[#3ed660] font-normal">{drop.teams}</span>
              </div>
              
              <p className="text-xs text-gray-400 font-normal">
                {drop.desc}
              </p>
            </div>

            {/* Action Notify Button */}
            <div className="md:pl-4 flex items-center justify-end">
              <button 
                onClick={() => onNotifyMe && onNotifyMe(drop.title)}
                className="w-full md:w-auto btn-secondary text-xs py-2.5 px-4 flex items-center justify-center gap-1.5 hover:border-[#ff3b30] hover:text-[#ff3b30]"
              >
                <Bell size={13} />
                <span>NOTIFY ME</span>
              </button>
            </div>

          </div>
        ))}
      </div>

    </section>
  );
}
