import logo from "../assets/logo-white.png";

const Logo = () => {
   return (
      <img
         src={logo}
         alt="Aboki Logo"
         className=" object-cover rounded-lg w-45 h-10 mr-4"
      />
   );
};

export default Logo;
